# Review checklist — run against every diff before merge

Answer each line PASS / FAIL / N/A with the file:line that proves it.
The AI runs this on its own diff (rule 10 in CLAUDE.md); you re-run it in a FRESH chat
with `/review` so the reviewer is not defending its own work.

## Pairing and messages (`link.js`, pairing flow)
- [ ] A third device cannot join a session: the laptop accepts one phone, and messages from anyone else are ignored
- [ ] The pairing code/secret cannot be guessed or read off the public relay (wildcard subscribers see nothing usable)
- [ ] Every received message is checked before use: authenticated (when auth exists), known `type`, fields of the right type and range
- [ ] A spoofed or replayed message cannot change what the laptop draws, what it stores or the profile it builds
- [ ] New message types are documented in `docs/ARCHITECTURE.md`, idempotent on resend, and acked
- [ ] No message carries more data than the feature needs (state what a relay subscriber can see)

## Camera data stays on the phone
- [ ] Camera frames are reduced to numbers inside the capture loop; no pixels, images, video or canvas data are sent, stored or logged
- [ ] No new upload, fetch or third-party call from `phone.html` beyond the MQTT relays

## Camera settings
- [ ] Every exposure / white-balance / focus lock is read back with `getSettings()` (and `getCapabilities()`) before the code relies on it
- [ ] What was actually locked is reported to the user/result; "not locked" has a working path (ratios, relative steps)

## Colour maths
- [ ] Every new or changed conversion (gamma, L*, sRGB↔XYZ, chromaticity→XYZ, Bradford/D50, white point, ICC encoding) has a test against published reference values, with the source cited next to it
- [ ] No expected value in a test was produced by running our own code
- [ ] Maths lives in `analysis.js` / `calib.js` / `icc.js`, not inline in pages; no duplicate of an existing helper
- [ ] `node --test tests/*.test.js` passes (output pasted)

## ICC profile and installer
- [ ] Changes to `icc.js`: header/tags still valid ICC v2.4; output parsed by LittleCMS or Pillow (`ImageCms.getOpenProfile`) without error
- [ ] `vcgt` still 3 × 256 × 16-bit, monotonic ramps, no values outside 0–65535
- [ ] Changes to `install.js` approved by the user; it still only installs/associates the profile and switches Windows calibration on

## Secrets and client code
- [ ] No secrets, keys or tokens in any file (everything here is public on GitHub Pages)
- [ ] User-controlled text (EDID paste, messages, stored data) is escaped before going into `innerHTML`

## Bundled libraries (`lib/`)
- [ ] Versions unchanged, or the change is approved: name, version, licence file present, size, reason
- [ ] `?v=` / build version bumped where a page or script changed

## Correctness & maintainability
- [ ] Every acceptance criterion in the spec has a test or a stated manual check on the real iPhone + laptop
- [ ] Results say what was simulated and what was run on real devices
- [ ] No empty `catch` hiding a real failure (ignoring an unsupported browser feature is fine if the user is told)
- [ ] New user-facing strings have a German entry in `i18n.js`
- [ ] No file grew past ~300 lines without a reason (pages excepted until split)
- [ ] No existing test edited or deleted to make it pass
