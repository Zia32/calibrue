// Calibrue one-click installer: a .cmd file that runs the PowerShell below. It installs the
// profile, makes it the default for the laptop's built-in screen, checks that Windows really
// took it, and turns on "Use Windows display calibration". It asks for administrator permission
// once (installing a colour profile and that switch both require it).
// Browser: window.Installer. Node: module.exports (for tests).
(function (root) {
  const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return (typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64')); };

  // target: the screen it was measured on, {internal, label} (from the laptop page), or nothing.
  function script(profileBytes, fileName, target) {
    const name = String(fileName).replace(/[^A-Za-z0-9._-]/g, '_');
    const data = b64(profileBytes).replace(/(.{100})/g, '$1\n'); // wrapped for readability
    const tInternal = target && target.internal === true ? '$true' : target && target.internal === false ? '$false' : '$null';
    const tLabel = String((target && target.label) || '').replace(/[^\w .()-]/g, '');
    // The first block is read by cmd.exe and is a comment for PowerShell; the rest is PowerShell.
    const ps = String.raw`<# : Calibrue profile installer. Double-click to run.
@echo off
set "CALIBRUE_SELF=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([IO.File]::ReadAllText($env:CALIBRUE_SELF))"
echo.
pause
exit /b
#>
$ErrorActionPreference = 'Stop'
$ProfileName = '${name}'
$TargetInternal = ${tInternal}   # measured on the built-in screen?
$TargetLabel = '${tLabel}'      # or this monitor (name as Windows shows it)
$ProfileData = @'
${data}
'@

function Say($text, $colour = 'Gray') { Write-Host $text -ForegroundColor $colour }

function Main {
  Say 'Calibrue: installing your display profile' 'Cyan'
  Say "Profile: $ProfileName"
  $me = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
  if (-not $me.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Say 'Windows needs administrator permission to install a colour profile. Please click Yes.' 'Yellow'
    try { Start-Process -FilePath $env:ComSpec -ArgumentList '/c', ('"' + $env:CALIBRUE_SELF + '"') -Verb RunAs }
    catch { Say 'Permission was not given, so nothing was changed.' 'Red'; return }
    Say 'The installer continues in the new window. You can close this one.'
    return
  }

  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class CalibrueWcs {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct DISPLAY_DEVICE {
    public int cb;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string DeviceName;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceString;
    public int StateFlags;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceID;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceKey;
  }
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern bool EnumDisplayDevicesW(string device, uint index, ref DISPLAY_DEVICE info, uint flags);
  [DllImport("mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool InstallColorProfileW(string machine, string profile);
  [DllImport("mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsSetUsePerUserProfiles(string device, uint deviceClass, bool usePerUser);
  [DllImport("mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsAssociateColorProfileWithDevice(int scope, string profile, string device);
  [DllImport("mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsSetDefaultColorProfile(int scope, string device, int type, int subType, uint id, string profile);
  [DllImport("mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsGetDefaultColorProfile(int scope, string device, int type, int subType, uint id, uint bytes, StringBuilder profile);
  [DllImport("mscms.dll", SetLastError = true)]
  public static extern bool WcsSetCalibrationManagementState(bool enabled);
}
'@
  $USER = 1; $SYSTEM = 0; $CPT_ICC = 0; $CPST_NONE = 4; $CLASS_MONITOR = 0x6D6E7472  # 'mntr'

  # 1. Install the profile file (copied into Windows' colour folder).
  $tmp = Join-Path $env:TEMP $ProfileName
  [IO.File]::WriteAllBytes($tmp, [Convert]::FromBase64String(($ProfileData -replace '\s', '')))
  if (-not [CalibrueWcs]::InstallColorProfileW($null, $tmp)) { throw "Windows refused to install the profile (error $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))." }
  Say '1/3  Profile installed.' 'Green'

  # 2. Find the built-in laptop screen: Windows marks internal panels with output type 0x80000000.
  $internal = @()
  try { $internal = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorConnectionParams | Where-Object { [uint32]$_.VideoOutputTechnology -eq [uint32]2147483648 } | ForEach-Object { ($_.InstanceName -split '\\')[1] }) } catch {}
  $monitors = @()
  for ($a = 0; ; $a++) {
    $ad = New-Object CalibrueWcs+DISPLAY_DEVICE; $ad.cb = [Runtime.InteropServices.Marshal]::SizeOf($ad)
    if (-not [CalibrueWcs]::EnumDisplayDevicesW($null, [uint32]$a, [ref]$ad, 0)) { break }
    for ($m = 0; ; $m++) {
      $mo = New-Object CalibrueWcs+DISPLAY_DEVICE; $mo.cb = [Runtime.InteropServices.Marshal]::SizeOf($mo)
      if (-not [CalibrueWcs]::EnumDisplayDevicesW($ad.DeviceName, [uint32]$m, [ref]$mo, 0)) { break }
      if (($mo.StateFlags -band 1) -eq 0) { continue } # not attached
      $mi = New-Object CalibrueWcs+DISPLAY_DEVICE; $mi.cb = [Runtime.InteropServices.Marshal]::SizeOf($mi)
      [void][CalibrueWcs]::EnumDisplayDevicesW($ad.DeviceName, [uint32]$m, [ref]$mi, 1) # interface name
      $model = ($mo.DeviceID -split '\\')[1]
      $monitors += [pscustomobject]@{ Name = $mo.DeviceString; Model = $model; Key = $mo.DeviceKey; Id = $mo.DeviceID; Path = $mi.DeviceID; Internal = ($internal -contains $model) }
    }
  }
  if ($monitors.Count -eq 0) { throw 'Windows reported no screens.' }
  # Pick the screen it was measured on: by name for a monitor, or the built-in panel.
  $target = @()
  if ($TargetLabel -and $TargetInternal -ne $true) {
    try {
      $named = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID | Where-Object {
        (-join ($_.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ })) -eq $TargetLabel } | ForEach-Object { ($_.InstanceName -split '\\')[1] })
      $target = @($monitors | Where-Object { $named -contains $_.Model })
    } catch {}
  }
  if ($target.Count -ne 1 -and $TargetInternal -ne $false) { $target = @($monitors | Where-Object Internal) }
  if ($target.Count -ne 1) {
    if ($monitors.Count -eq 1) { $target = @($monitors[0]) }
    else {
      Say ('Which screen did you calibrate?' + $(if ($TargetLabel) { " (measured on: $TargetLabel)" } else { '' })) 'Yellow'
      for ($i = 0; $i -lt $monitors.Count; $i++) { Say ("  {0}. {1} ({2})" -f ($i + 1), $monitors[$i].Name, $monitors[$i].Model) }
      $pick = [int](Read-Host 'Number') - 1
      if ($pick -lt 0 -or $pick -ge $monitors.Count) { throw 'No screen chosen.' }
      $target = @($monitors[$pick])
    }
  }
  $t = $target[0]
  Say "2/3  Screen: $($t.Name) ($($t.Model))" 'Green'

  # 3. Make it that screen's default. Windows' documentation does not pin down which form of the
  # screen's name these calls want, so try each and keep the one Windows confirms.
  $ok = $null
  foreach ($dev in @($t.Key, $t.Id, $t.Path) | Where-Object { $_ }) {
    try {
      [void][CalibrueWcs]::WcsSetUsePerUserProfiles($dev, $CLASS_MONITOR, $true)
      [void][CalibrueWcs]::WcsAssociateColorProfileWithDevice($USER, $ProfileName, $dev)
      [void][CalibrueWcs]::WcsSetDefaultColorProfile($USER, $dev, $CPT_ICC, $CPST_NONE, 0, $ProfileName)
      [void][CalibrueWcs]::WcsAssociateColorProfileWithDevice($SYSTEM, $ProfileName, $dev)
      [void][CalibrueWcs]::WcsSetDefaultColorProfile($SYSTEM, $dev, $CPT_ICC, $CPST_NONE, 0, $ProfileName)
      $sb = New-Object Text.StringBuilder 520
      if ([CalibrueWcs]::WcsGetDefaultColorProfile($USER, $dev, $CPT_ICC, $CPST_NONE, 0, 1040, $sb) -and $sb.ToString() -ieq $ProfileName) { $ok = $dev; break }
    } catch {}
  }
  if (-not $ok) {
    Say 'Windows did not confirm the profile as the default for this screen.' 'Red'
    Say 'Finish by hand (1 minute): colorcpl opens now. Devices tab: tick "Use my settings for this device",' 'Yellow'
    Say "select $ProfileName (Add... if it is not listed), Set as Default Profile; then Advanced tab:" 'Yellow'
    Say '"Change system defaults..." > Advanced > tick "Use Windows display calibration".' 'Yellow'
    Start-Process colorcpl
    return
  }

  # Turn on "Use Windows display calibration"; switching it off and on makes Windows load the
  # profile's correction straight away.
  [void][CalibrueWcs]::WcsSetCalibrationManagementState($false)
  if (-not [CalibrueWcs]::WcsSetCalibrationManagementState($true)) { Say 'Could not switch on "Use Windows display calibration". Tick it in colorcpl > Advanced > Change system defaults.' 'Yellow' }
  Say '3/3  Set as default, and Windows display calibration is on.' 'Green'
  Say ''
  Say 'Done. Restart your browser so it picks up the profile, then run Verify on the iPhone.' 'Cyan'
  Say 'To undo: colorcpl > Devices > select the profile > Remove.'
}

try { Main } catch { Say ('Stopped: ' + $_.Exception.Message) 'Red'; Say 'Nothing else was changed. You can install the .icc by hand with colorcpl.' }
`;
    return ps.replace(/\r?\n/g, '\r\n'); // Windows line endings, which cmd.exe needs
  }

  const api = { script };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Installer = api;
})(typeof window !== 'undefined' ? window : globalThis);
