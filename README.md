# Calibrue — signal test, pairing, tone curves

Two static web pages. No build step, no server code of our own. The phone and laptop exchange small messages through two public MQTT relays (EMQX and HiveMQ) at once; each message goes over both and duplicates are dropped, so either relay alone is enough. A direct WebRTC link was tried first but failed on routers that block local discovery.

| File | Runs on | Does |
|---|---|---|
| `index.html` | either | Links to the two pages |
| `laptop.html` | Windows laptop (Edge or Chrome) | Flickers a test patch at a fixed frequency |
| `phone.html` | iPhone (Safari) | Measures the flicker with the camera |
| `analysis.js` | phone | Lock-in amplitude, noise floor, SNR |
| `calib.js` | phone | Null search, per-channel tone curves, correction ramps |
| `link.js` | both | Phone ↔ laptop messages over the relays |
| `lib/` | both | MQTT.js 5.10.1 (relay client) and qrcodejs 1.0.0 (QR code), MIT licensed |

## 1. Host it (GitHub Pages, free, HTTPS)

The iPhone camera only works on HTTPS pages, so the files must be hosted.

1. Create a public repo on GitHub, e.g. `calibrue`.
2. Upload all five files to the repo root (Add file → Upload files → Commit).
3. Settings → Pages → Source: "Deploy from a branch" → Branch `main`, folder `/ (root)` → Save.
4. After about a minute the site is at `https://<your-username>.github.io/calibrue/`.

## 2. Pair the devices

1. Laptop: open `laptop.html`. A QR code and a 6-letter code appear top left.
2. iPhone: scan the QR code with the Camera app (or open `phone.html` and type the code, then Connect).
3. Both show "connected" / "Paired". The phone's "Laptop shows" line mirrors the laptop's patch.
4. Phone: Start camera, press it flat on the square, then use **Automatic tests**.

## 3. Measure tone curves (M3)

1. Pair, start the camera, press the phone flat on the square.
2. Tap **Measure tone curves**. It measures red, green and blue (9 points each) in about 10 minutes.
3. Keep the phone still the whole time. The laptop shows the result under **Calibration**.
4. Tap **Copy results** and send them.

While one channel is measured, the other two sit at a constant 96. Without that, the camera exposes for a mostly dark patch and the measured channel clips.

## 4. Prepare

- Laptop: dim room, brightness at your normal level, Night light off, adaptive brightness off, no custom colour profile loaded.
- iPhone: clean the rear camera lens. A microfibre cloth over the camera bump protects the laptop screen.

## 5. Manual go/no-go test

1. Laptop: open `laptop.html`, press **F** for fullscreen. Mode **Step test**, v = 128, Δ = 1, 6 Hz. Press **Start flicker**.
2. iPhone: open `phone.html`, tap **Start camera** (Rear), allow camera access.
3. Press the rear camera flat on the centre square, screen facing you. Tap **Find** to lock onto the laptop's frequency.
4. Wait 4–8 seconds and read the pill and SNR.
5. Repeat at v = 32 and v = 224, then with Δ = 2 and Δ = 4.

**Pass:** "Flicker detected" (SNR ≥ 4) with Δ = 1 at v = 128 within an 8 s window.
**Marginal:** passes only at Δ = 2. The design still works, with 2-level precision.
**Fail:** needs Δ ≥ 4. The contact method needs rethinking before M2.

## 6. Manual null test (the automatic one is easier)

1. Laptop mode **Null test** (v vs checkerboard 0|255).
2. Step v with the arrow keys and watch the phone's "Step size" line.
3. The v with the lowest step is where your panel's v matches 50% light.
4. A panel at gamma 2.2 nulls near **v ≈ 186**. Much lower means a brighter-than-standard curve; much higher, darker.

## 7. Send back

Tap **Copy results** on the phone after each test and paste it into the chat, with the laptop settings you used (mode, v, Δ, Actual flicker, Dropped frames).
