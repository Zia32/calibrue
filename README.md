# Calibrue

Two static web pages. No build step, no server code of our own. The phone and laptop exchange small messages through two public MQTT relays (EMQX and HiveMQ) at once; each message goes over both and duplicates are dropped, so either relay alone is enough. A direct WebRTC link was tried first but failed on routers that block local discovery.

| File | Runs on | Does |
|---|---|---|
| `index.html` | either | Links to the two pages |
| `laptop.html` | Windows laptop (Edge or Chrome) | Flickers a test patch at a fixed frequency |
| `phone.html` | iPhone (Safari) | Measures the flicker with the camera |
| `analysis.js` | phone | Lock-in amplitude, noise floor, SNR |
| `calib.js` | phone | Null search, per-channel tone curves, correction ramps |
| `profile.html` | laptop | Builds the Windows .icc profile, EDID import, preview, install steps |
| `icc.js` | laptop | ICC v2.4 writer with a `vcgt` calibration table |
| `link.js` | both | Phone ↔ laptop messages over the relays |
| `report.html` | laptop | Calibration report |
| `store.js` | laptop | Current calibration, history (30 kept), which screen it belongs to |
| `install.js` | laptop | Builds the one-click installer (.cmd + PowerShell) |
| `lib/` | both | MQTT.js 5.10.1 (relay client) and qrcodejs 1.0.0 (QR code), MIT licensed |

## 1. Host it (GitHub Pages, free, HTTPS)

The iPhone camera only works on HTTPS pages, so the files must be hosted.

1. Create a public repo on GitHub, e.g. `calibrue`.
2. Upload all five files to the repo root (Add file → Upload files → Commit).
3. Settings → Pages → Source: "Deploy from a branch" → Branch `main`, folder `/ (root)` → Save.
4. After about a minute the site is at `https://<your-username>.github.io/calibrue/`.

## 2. Calibrate (one button)

1. Laptop: open `laptop.html` on the charger, with Windows **Change brightness based on content: Off**, and any Calibrue profile's **Use Windows display calibration** unticked.
2. iPhone: scan the laptop's QR code. The phone pairs through the relays.
3. Press the rear camera flat on the centre square and tap **Calibrate**. About 6 minutes:
   - **Signal check:** a 1-level step must reach SNR 4, or it stops and says what to fix.
   - **Pattern check:** grey null with 1×1 and 2×2 checkers and horizontal and vertical lines. The patterns that agree give the grey gamma; one of them is used from here on.
   - **Colour curves:** red, green and blue are measured together, each flickering at its own frequency (about 7.5, 6 and 5 Hz at 60 Hz refresh), separated on the phone with a Hann-windowed analysis. 9 points per colour; each null gets 7 measurements (3 around the prediction, 2 to confirm, 2 close to the null). Steps are read relative to the camera's average level so exposure changes cancel; a measurement stops after 1.3 s when the signal is already clear.
   - **Stability check:** the grey reference again; drift over 1 level is flagged and the anchor uses the average.
   - **Build profile:** the curves are shifted so their mean matches the grey gamma (single-channel patches read about 0.08 higher on Zia's panel), then turned into ramps. In a physical simulation (display frames, camera exposure, sensor crosstalk, tone curve, noise) this matches the one-colour-at-a-time method's accuracy (corrected-screen error typically ΔL* ≈ 0.4) in a bit over half the time.
4. The laptop shows **Profile ready**: download, optional EDID colours, install steps.
5. Install with **Download one-click installer** (`Install Calibrue profile.cmd`: double-click, allow; it installs the profile, sets it as the built-in screen's default, checks that Windows confirmed it, and switches on Windows display calibration), or by hand with colorcpl.
6. Pair again and tap **Verify**: grey at 25/50/75% light. Largest error ΔL* ≤ 0.5 is on target; otherwise the laptop builds a refined profile (`-r1`) that corrects the whole curve.
7. `report.html`: before/after, tone-response chart, every check (signal, pattern agreement, stability drift, grey balance) and the verification history; prints to PDF.

**External monitors:** drag the laptop page onto the monitor and press F for fullscreen there. With the browser's window-management permission ("Identify this screen" in the panel) the page knows the screen's name; calibrations, file names (`calibrue-UP3017-….icc`) and the installer then target that screen. Without it, the installer asks which screen.

`profile.html` has **All calibrations** (use an older one or delete it), the details view, EDID tools and **Match the white**: two sliders (warmer/cooler, greener/magenta) to match the laptop's white to another screen by eye. The result scales the three ramps (largest gain stays 1), so greys carry the same tint and peak brightness drops only a few percent. The camera is not used for this because its colour response differs from the eye's between different panel types. The single tests are under **Advanced tools** on the phone.

## 3. Prepare

- Laptop: **plugged in**, dim room, brightness at your normal level, Night light off, **Change brightness based on content: Off** (it is often 'On battery only'), no custom colour profile loaded while measuring.
- iPhone: clean the rear camera lens. A microfibre cloth over the camera bump protects the laptop screen.

## 4. Manual go/no-go test

1. Laptop: open `laptop.html`, press **F** for fullscreen. Mode **Step test**, v = 128, Δ = 1, 6 Hz. Press **Start flicker**.
2. iPhone: open `phone.html`, tap **Start camera** (Rear), allow camera access.
3. Press the rear camera flat on the centre square, screen facing you. Tap **Find** to lock onto the laptop's frequency.
4. Wait 4–8 seconds and read the pill and SNR.
5. Repeat at v = 32 and v = 224, then with Δ = 2 and Δ = 4.

**Pass:** "Flicker detected" (SNR ≥ 4) with Δ = 1 at v = 128 within an 8 s window.
**Marginal:** passes only at Δ = 2. The design still works, with 2-level precision.
**Fail:** needs Δ ≥ 4. The contact method needs rethinking before M2.

## 5. Manual null test (the automatic one is easier)

1. Laptop mode **Null test** (v vs checkerboard 0|255).
2. Step v with the arrow keys and watch the phone's "Step size" line.
3. The v with the lowest step is where your panel's v matches 50% light.
4. A panel at gamma 2.2 nulls near **v ≈ 186**. Much lower means a brighter-than-standard curve; much higher, darker.

## 6. Send back

Tap **Copy results** on the phone after each test and paste it into the chat, with the laptop settings you used (mode, v, Δ, Actual flicker, Dropped frames).
