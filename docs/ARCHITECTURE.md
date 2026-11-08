# Architecture — Calibrue

> How the app is built today. The AI follows it; it does not invent it. Change it only with a decision in `CLAUDE.md`'s log.

## Stack
- Frontend: static HTML pages with inline CSS/JS plus shared vanilla-JS modules. No framework, no bundler, no build step.
- Backend: none of our own. Messages between the two devices go through public MQTT brokers over WebSocket (TLS).
- Storage: the laptop browser's localStorage. Nothing is stored on any server.
- Auth: none. A device joins a session by knowing its 6-character pairing code (see Pairing).
- Hosting: GitHub Pages from `main` (HTTPS, needed for the camera and service worker). Local: `python3 -m http.server` (localhost counts as secure).
- Offline: `sw.js`, network first, caches the site's own files; pairing still needs the network.

## The two devices
```
 LAPTOP (Edge/Chrome, Windows)                      IPHONE (Safari)
 laptop.html                                        phone.html
   draws test patches at fixed flicker rates          camera → 64×48 canvas → channel means per frame
   stores results (store.js, localStorage)            analysis.js: lock-in amplitude, SNR (on the phone)
   builds profile (icc.js) + installer (install.js)   calib.js: null search, curves, ramps
 profile.html  report.html  patterns.html           sends commands + results ↓↑
        ▲                                                   │
        └──────── link.js: JSON over 2 public MQTT relays ──┘
```
- The phone drives: it sends `set` commands (what the laptop should draw), measures, and sends results.
- The laptop obeys and stores: it draws exactly what `set` says, reports its `state`, and saves results, replying with an ack.

## Pairing and messages (`link.js`)
- The laptop makes a 6-character code from `crypto.getRandomValues` over a 31-character alphabet (≈ 8.9 × 10⁸ codes) and shows it as text and as a QR code (`phone.html?pair=CODE`).
- Both sides connect to `wss://broker.emqx.io:8084/mqtt` and `wss://broker.hivemq.com:8884/mqtt`, publish every message on both, and drop duplicates by message id. Topics: `calibrue/v1/<code>/L` (to laptop), `calibrue/v1/<code>/P` (to phone).
- Liveness: phone sends `hello` until answered, then `ping` every 4 s; the laptop answers with `state`.
- Reliability: commands and results are resent every ~1 s until acked (15 s timeout); receivers are idempotent (`when`/id checks).
- Message types: `hello`, `ping`, `state`, `set`, `ack`, `progress`, `calibration` → `calibration-saved`, `verify-result` → `verify-saved`, `refine` → `refined`, `check-result` → `check-saved`, `white-match` → `check-saved`.
- Payloads carry derived numbers only (null levels, gammas, ratios, ramps, progress text). No camera pixels.

### Known gaps (against the Domain rule in CLAUDE.md)
- Messages are plain JSON on public brokers: anyone can subscribe to `calibrue/v1/#`, see every session's code and data, and publish into a session (e.g. fake `set` commands or results).
- The code is the only secret; it is also visible to anyone subscribed to the wildcard. There is no handshake binding one phone to one laptop, so a third device can join.
- Code generation uses `byte % 31`, a slight bias.
- Fix direction (not built): treat the QR code as carrying a random topic AND a key; encrypt and authenticate messages (WebCrypto AES-GCM); laptop accepts the first phone that proves the key and ignores others.

## Where the maths lives
| Module | Runs on | Contents |
|---|---|---|
| `analysis.js` | phone, Node | detrend, single-frequency DFT amplitude (optional Hann window), spectrum, noise floor, SNR, peak finding |
| `calib.js` | phone, laptop, Node | `fitNull`/`findNull` (flicker-null fit in light space), measurement `PLAN`, `measureCurves` (R, G, B together), `smoothModel`/`curveF`/`curveV`, `ramp` (to gamma 2.2), `gammaHalf`, `shiftGamma`, `anchorShifts`/`shiftGammaAt` (grey anchoring at 25/50/75%), `refineRamps`/`refineRampsCurve`, `whiteGains`/`whiteOf`/`applyGains`, `Lstar` |
| `icc.js` | laptop, Node | chromaticity → XYZ, Bradford adaptation to D50, colorants, ICC v2.4 writer (`desc`, `cprt`, `wtpt`, `rXYZ/gXYZ/bXYZ`, 2.2 `curv` TRCs, `vcgt` 3×256×16-bit), EDID chromaticity parsing with scale detection and plausibility check, sRGB/P3 primaries |
| `install.js` | laptop, Node | builds the one-click installer (.cmd that runs embedded PowerShell; mscms.dll calls) |
| `store.js` | laptop | current calibration, history (30), screen identity (Window Management API) |
| `i18n.js` | all pages | English → German on the finished page and on later script messages |

Pages only orchestrate: UI, camera, timing, messages.

## Measurement principle
- Contact method: the phone's rear camera is pressed on the patch, which blocks room light.
- Flicker null: the laptop alternates a uniform patch at level v with a checkerboard of two levels at ~6 Hz. The flicker vanishes when both give the same light; that v fixes one point of the tone curve. The camera only has to see "more or less flicker", never absolute colour.
- R, G, B are measured at the same time at different flicker rates (~7.5/6/5 Hz) and separated by frequency on the phone.
- Colour ratios (uniformity, white match) use camera R/G and B/G with white balance locked where the phone allows it; values are converted to light assuming the camera's ~1/2.2 response.

## Storage (laptop localStorage)
`calibrue.calibration` (current), `calibrue.history`, `calibrue.white` (white gains/sliders), `calibrue.checks` (screen checks), `calibrue.edid`, `calibrue.pattern`, `calibrue.lang`.

## Testing
- Today: no tests in the repo. Development used throwaway Node simulations and Playwright runs (fake camera, simulated panel, local MQTT broker) that were not committed.
- The modules are already importable from Node (`module.exports`), so unit tests need no browser.
- Proposed (awaiting approval): `node --test` with `node:assert`, no dependencies, in `tests/*.test.js`, covering colour maths against published reference values. Not added until Zia approves.

## Cross-cutting decisions
- Errors: user-facing messages say what to do next; measurement failures are non-fatal where a retry can recover.
- Versioning: `calibrue-build` meta + `?v=` query on scripts and the QR link, to beat stale caches.
- Time zone: timestamps stored as ISO UTC; shown in the browser's locale.
- Languages: English source, German via `i18n.js`; `?lang=de|en`, saved choice, then browser language.

## Scale assumptions
- One phone and one laptop per session; a few sessions per user per month.
- localStorage: history capped at 30 calibrations (each a few kB); oldest dropped when full.
- Slowest operation: a full calibration, ~7 minutes, bounded by camera frames needed per null.
