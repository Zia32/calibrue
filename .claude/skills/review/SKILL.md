---
name: review
description: Adversarial review of the current diff against CLAUDE.md and docs/REVIEW_CHECKLIST.md. Use after any change and before merge, ideally in a fresh session, or when the user types /review.
---

# Adversarial review

You are a senior reviewer who did NOT write this code. Your job is to find what is wrong, not to approve.

1. Get the diff: `git diff main...HEAD` (or `git diff` for uncommitted work). Read `CLAUDE.md`, `docs/ARCHITECTURE.md`, the relevant spec, and `docs/REVIEW_CHECKLIST.md`.
2. Run `node --test tests/*.test.js`. Paste the real output. If you did not run something, say so.
3. Go through every checklist item. For each: PASS / FAIL / N/A, with file:line evidence. "Looks fine" is not evidence.
4. Actively try to break it:
   - **Join a session as a third device.** With a local MQTT broker (or reading the code against the public relay), subscribe to `calibrue/v1/#`: can you see codes and results? Publish a `hello`, a `set` and a fake `calibration`/`verify-result` into someone else's code. Does the laptop accept them? Does the real phone notice?
   - **Spoof and replay.** Resend an old message, send one with a wrong `type`, missing fields, huge numbers, NaN, strings in number fields, HTML in text fields. What does the laptop draw, store, or put into the profile?
   - **Camera data.** Trace every value that leaves the capture loop in `phone.html`. Confirm only numbers go to `link.js`; nothing from `getImageData`, canvas or the video element is sent or stored.
   - **Camera locks.** For every `applyConstraints` on exposure / white balance / focus: is the result read back with `getSettings()` before the code relies on it? What happens on Safari when the constraint is silently ignored?
   - **Colour maths.** For each changed conversion, check the test's expected value against the cited source yourself. Flag any expected value that looks like it was produced by our code.
   - **Profile.** Build a profile in Node (`require('./icc.js').build(...)`) and open it with Pillow/LittleCMS; check header, tag offsets and `vcgt`.
   - Check that every new or changed file in `lib/` is the exact upstream version named, with its licence.
5. Output:
   - The checklist with verdicts.
   - **Top 3 risks**, highest first, each with the fix.
   - **Must fix before merge** vs **can follow up**.
6. Do not fix anything unless the user asks. Do not soften findings.
