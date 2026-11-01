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
3. Press the rear camera flat on the centre square and tap **Calibrate**. About 12 minutes:
   - **Signal check:** a 1-level step must reach SNR 4, or it stops and says what to fix.
   - **Pattern check:** grey null with 1×1 and 2×2 checkers and horizontal and vertical lines. The patterns that agree give the grey gamma; one of them is used from here on.
   - **Red, green, blue curves:** 9 points each, other channels at 96.
   - **Build profile:** the curves are shifted so their mean matches the grey gamma (single-channel patches read about 0.08 higher on Zia's panel), then turned into ramps.
4. The laptop shows **Profile ready**: download, optional EDID colours, install steps.
5. After installing, pair again and tap **Verify** on the phone. Within ±0.03 of 2.2 it says on target. Otherwise the laptop builds a refined profile (`-r1`) to install instead.

`profile.html` still has the details view and EDID tools. The single tests are under **Advanced tools** on the phone.

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
