# CLAUDE.md — Calibrue project rules (read before EVERY task)

> Keep this file under ~80 lines. When you correct the AI on the same thing twice, add a rule here.
> How the pieces fit: `docs/ARCHITECTURE.md`. User-facing flow: `README.md`.

## Project
- Name: Calibrue (calibrue.com)
- What it does: calibrates a Windows laptop or monitor's tone curve with the iPhone camera pressed on the screen, and writes a Windows ICC profile with a `vcgt` calibration table.
- Users & roles: one person, two of their own devices: the laptop (shows test patches, keeps results, builds the profile) and the iPhone (camera, does the measuring). No accounts, no server of our own.
- Expected scale: one session at a time per laptop; ~7 min per calibration; history keeps 30 calibrations in the laptop's localStorage.
- Stack: static HTML + vanilla JS (no framework, no build step), GitHub Pages (HTTPS), public MQTT relays (EMQX, HiveMQ) via vendored MQTT.js 5.10.1, vendored qrcodejs 1.0.0. Target browsers: Safari on iPhone, Edge/Chrome on Windows.
- Run: `python3 -m http.server 8000` in the repo root (camera and pairing need HTTPS or localhost) · Test: none in the repo yet (see `docs/ARCHITECTURE.md` → Testing) · Lint: none

## Architecture (non-negotiable)
- Maths lives in the plain JS modules (`analysis.js`, `calib.js`, `icc.js`), which run in the browser AND in Node (`module.exports`). Pages call them; pages do not reimplement maths.
- The laptop page is the only owner of stored results (`store.js`, localStorage keys `calibrue.*`). The phone measures and sends results; it keeps nothing durable except preferences.
- Phone ↔ laptop only through `link.js` messages (`{type, ...}` JSON). New message types: document them in `docs/ARCHITECTURE.md`, make the receiver idempotent (resends happen), and reply with an ack/`*-saved`.
- Before writing a function, SEARCH for an existing one in the modules above. Reuse or extend. Never duplicate logic.
- No new dependency, CDN script or external service without asking (name, licence, size, last release, reason). Vendored libs go in `lib/` with their licence.
- Every page shows the build version (`<meta name="calibrue-build">`); bump it on every user-visible change, and keep the `?v=` on script tags in step.
- English is the source text; German comes from `i18n.js`. New user-facing strings need a German entry.

## Domain rules
- Camera frames are processed on the phone and never uploaded, sent over the link or stored. Only derived numbers (channel means, amplitudes, nulls, results) may leave the camera loop; never send pixels, images or video.
- Pairing must not be joinable by a third device or by guessing the code. Any change to `link.js` or the pairing flow must keep or improve this, and must say what an attacker on the public relay can see and send. Current gaps are listed in `docs/ARCHITECTURE.md` → Pairing; do not add features that send more sensitive data until they are closed.
- Colour conversions (gamma/tone curves, L*, sRGB↔XYZ, chromaticity→XYZ, Bradford/D50 adaptation, white point, ICC encodings) must be tested against published reference values (IEC 61966-2-1, ICC.1, CIE 15, Lindbloom tables), with the source cited in the test.
- Never assume Safari lets us lock exposure or white balance. After `applyConstraints`, read `track.getCapabilities()`/`getSettings()` to confirm, report what was actually locked, and keep a path that works when nothing can be locked (ratios, relative steps).
- Measurements are relative (flicker nulls, ratios), never absolute camera values: the camera is not a colorimeter. Do not claim nits, contrast, gamut or ΔE from the camera.
- The profile must stay valid ICC v2.4 that Windows accepts; any change to `icc.js` is checked by parsing the output (LittleCMS/Pillow) before it ships.
- The installer (`install.js`) runs as administrator on the user's PC: change it only with the user's approval, keep it read-only except installing/associating the profile, and keep the "nothing else was changed" promise true.

## Working rules for the AI
1. Read this file, `docs/ARCHITECTURE.md` and the relevant spec in `docs/specs/` first.
2. PLAN before coding. Wait for approval of the plan.
3. Write/update tests for the acceptance criteria BEFORE implementation.
4. Work in small slices. One plan step per change.
5. Never add a dependency without asking (see Architecture).
6. Never force-push, rewrite `main` history or delete the user's stored calibrations without explicit approval.
7. Never edit or delete a test to make it pass. If a test looks wrong, stop and say so.
8. Never claim it works unless you ran it. Paste the command and output. Say plainly what was only simulated and what needs the real iPhone + laptop.
9. If stuck after 2 attempts, stop and explain the root cause in words before changing more code.
10. After finishing, run `docs/REVIEW_CHECKLIST.md` against your own diff and report pass/fail per item.

## Decisions log (newest first)
- 2026-11-08 Adopted the AI Dev Kit; rewrote these rules for a static, two-device web app.
- 2026-11-02 Calibrate anchors colour curves to grey at 25/50/75% light (single-colour patches read ~0.08 gamma higher than grey).
- 2026-11-01 Pairing over two public MQTT relays at once; direct WebRTC failed on routers that block local discovery.
- 2026-11-01 Contact (flicker-null) method: phone pressed on the screen, compare uniform patch vs checkerboard; no absolute colour sensing.
