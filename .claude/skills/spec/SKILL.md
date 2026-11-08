---
name: spec
description: Write or complete a feature spec in docs/specs/ by interviewing the user before any code is written. Use when starting a new feature or when the user types /spec.
---

# Write a feature spec

Goal: turn a feature idea into `docs/specs/<feature-slug>.md` using `docs/specs/_TEMPLATE.md`, with no gaps the AI would otherwise fill by guessing.

1. Read `CLAUDE.md` and `docs/specs/_TEMPLATE.md`.
2. Ask the user what the feature is, if not already given.
3. Draft every section of the template from what you know. Mark each unknown as `[?]`.
4. Ask the user the questions a senior engineer would ask, in ONE batch, grouped by section. Always cover:
   - Which roles can view / create / edit / approve / delete, and the scope rule (own records, branch, tenant).
   - Exact business rules and formulas, with one worked example each.
   - Expected volume (rows per year, concurrent users).
   - What happens with: two users at once, double submit, partial failure, closed/locked records, invalid input.
5. Fill in the answers. Turn every rule and edge case into a Given/When/Then acceptance criterion.
6. Always include acceptance criteria for: unauthorized direct API access returns 403, and 20 parallel requests leave the data correct.
7. List anything still unknown under Open questions. Do not invent business rules, tax rules, accounting standards or regulatory formulas — ask.
8. Save the file with Status: Draft and show the user a short summary. Do not write code.
