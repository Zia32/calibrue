# AI Dev Kit — a system for building apps with AI that don't break

Copy this kit into every new project. It stops the known AI-coding failures
(insecure code, N+1 queries, race conditions, duplicated logic, architecture drift,
fake packages, destructive commands) with three layers:

| Layer | What it is | Why it works |
|---|---|---|
| 1. Rules | `CLAUDE.md`, `docs/ARCHITECTURE.md` | The AI reads them every session, so decisions don't get lost between chats |
| 2. Process | Spec -> Plan -> Tests -> Slice -> Review (skills `/spec`, `/plan-feature`, `/review`) | The AI gets the context it lacks *before* it writes code |
| 3. Gates | Hook blocking destructive commands, CI that blocks merges, guardrail tests | Enforced by machines, so it works even when the AI ignores a rule |

Rules alone are not enough: AI forgets or ignores text rules under long contexts.
Layer 3 is what makes the system reliable.

## What's in the kit

```
CLAUDE.md                          project rules the AI reads every session
docs/ARCHITECTURE.md               stack, layers, cross-cutting decisions (fill once)
docs/specs/_TEMPLATE.md            feature spec template
docs/REVIEW_CHECKLIST.md           checklist every diff must pass
.claude/settings.json              registers the guard hook (Claude Code)
.claude/hooks/guard-bash.sh        blocks rm -rf, DROP, TRUNCATE, force-push, prod access
.claude/skills/spec|plan-feature|review   the three workflow commands (Claude Code)
.github/workflows/quality-gates.yml       lint, types, tests, npm audit, secret scan, Semgrep
tests/_templates/guardrails.test.ts       auth/scope, concurrency, idempotency, N+1 tests
install.sh                         copies the kit into a project
```

## Step 1 — Kickoff (once per project, ~1 hour)

1. `./install.sh /path/to/new-project` (needs `jq` for the hook).
2. Fill `docs/ARCHITECTURE.md` yourself: stack, layers, roles, scope rule, money type, scale numbers.
   You decide the architecture; the AI follows it.
3. Fill the `[brackets]` in `CLAUDE.md`, including **Domain rules** (e.g. "debits must equal credits").
4. Create three environments: local dev, staging, production. The AI only ever gets **dev** credentials.
5. Push to GitHub. Turn on branch protection for `main` and mark the `quality-gates` jobs as required.
6. `git commit` before every AI session so anything can be rolled back.

## Step 2 — Every feature (the loop)

| # | Step | Command / prompt | You check |
|---|---|---|---|
| 1 | Spec | `/spec <feature>` | Rules, roles, edge cases, volumes are right; no invented business rules |
| 2 | Plan | `/plan-feature <feature>` | Reuses existing code; concurrency, security, indexes covered. Approve or correct |
| 3 | Tests first | "Write the tests from the plan, using tests/_templates/guardrails.test.ts. Run them; they should fail." | Tests exist for every acceptance criterion |
| 4 | Build in slices | "Implement step N of the plan only. Run tests, paste output." | Small diff, tests pass with real output |
| 5 | Review | New session: `/review` | Fix every "must fix" |
| 6 | Merge | Open PR; CI gates must be green | Never merge on red |
| 7 | Update docs | "Update the spec status and the CLAUDE.md decisions log." | Next session knows what changed |

**Session hygiene:** one task per session; start fresh instead of continuing a long chat;
if the AI fails twice on the same bug, stop and make it explain the root cause first.

## Step 3 — Before each release

- Run `docs/REVIEW_CHECKLIST.md` across the whole release, not just the last diff.
- Seed realistic data (e.g. 3 years of records) and load the heaviest screens; check query logs.
- Open an incognito window and call the API without logging in.
- Test a backup restore.

## Step 4 — Keep the system improving

- Corrected the AI on the same thing twice -> add a line to `CLAUDE.md`.
- A bug reached production -> add a test for it and a checklist line so it can't recur.
- Keep `CLAUDE.md` short (under ~80 lines). Long rule files get skimmed.

## Using it in claude.ai chat instead of Claude Code

The hook and slash commands only run in Claude Code. In a claude.ai chat:
1. Create a Project per app and add `CLAUDE.md`, `docs/ARCHITECTURE.md` and the current spec as project files.
2. Paste the matching step prompt from the table above (the skill files contain the full prompt text).
3. CI gates still apply when you push to GitHub, so bad code is still blocked at merge.

## Adapting to another stack

`CLAUDE.md`, the specs and the checklist are stack-agnostic. Change the commands in
`quality-gates.yml` (e.g. `pytest`, `pip-audit`, `ruff` for Python; `composer audit` for PHP)
and translate the guardrail tests to your test framework.
