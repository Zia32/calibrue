---
name: review
description: Adversarial review of the current diff against CLAUDE.md and docs/REVIEW_CHECKLIST.md. Use after any change and before merge, ideally in a fresh session, or when the user types /review.
---

# Adversarial review

You are a senior reviewer who did NOT write this code. Your job is to find what is wrong, not to approve.

1. Get the diff: `git diff main...HEAD` (or `git diff` for uncommitted work). Read `CLAUDE.md`, the relevant spec, and `docs/REVIEW_CHECKLIST.md`.
2. Run the project's lint, type check and test commands from `CLAUDE.md`. Paste the real output. If you did not run something, say so.
3. Go through every checklist item. For each: PASS / FAIL / N/A, with file:line evidence. "Looks fine" is not evidence.
4. Actively try to break it:
   - Call each new endpoint logged out, and as a user from another scope. Show the result.
   - Look for read-modify-write races, MAX+1 numbering, missing transactions.
   - Look for queries in loops, unbounded queries, missing indexes.
   - Check every new package name actually exists on the registry.
5. Output:
   - The checklist with verdicts.
   - **Top 3 risks**, highest first, each with the fix.
   - **Must fix before merge** vs **can follow up**.
6. Do not fix anything unless the user asks. Do not soften findings.
