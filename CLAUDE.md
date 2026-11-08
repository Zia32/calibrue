# CLAUDE.md — Project rules (read before EVERY task)

> Fill in the [brackets] at project kickoff. Keep this file under ~80 lines.
> When you correct the AI on the same thing twice, add a rule here.

## Project
- Name: [project]
- What it does: [one sentence]
- Users & roles: [e.g. admin, branch manager, clerk — what each may see/do]
- Expected scale: [concurrent users, rows/year, data retention years]
- Stack: [frontend, backend, DB, hosting]
- Run: `[dev command]` · Test: `[test command]` · Lint: `[lint command]`

## Architecture (non-negotiable)
- Layers: route/controller -> service (business logic) -> repository (DB). No SQL in routes or UI.
- Business rules, totals, permissions and validation live on the SERVER. The UI only displays.
- Before writing a function, SEARCH for an existing one. Reuse or extend. Never duplicate logic.
- One file = one responsibility. Split any file over ~300 lines.
- Folder map: [describe folders]

## Data integrity
- Money: integer minor units or DECIMAL. Never float.
- Every multi-step write runs inside ONE database transaction.
- Invariants are DB constraints (unique, foreign key, NOT NULL, CHECK) — app checks are extra, not instead.
- Sequential numbers come from DB sequences / locked counters, never MAX+1.
- Create/payment endpoints accept an idempotency key.
- Assume many users act at the same time. For every write, state what happens under concurrency.

## Security
- Every endpoint checks: (1) authenticated, (2) role allows the action, (3) record is in the user's scope (owner/tenant/branch).
- Parameterized queries / ORM only. No string-built SQL. Escape all output.
- No secrets in code or client bundles. Env vars only. Keep `.env.example` updated.
- Never swallow errors. Log with context; return typed errors. No stack traces to users.
- Rate-limit auth endpoints. Hash passwords with bcrypt/argon2.

## Performance
- No queries or API calls inside loops. Use joins / batched `IN (...)`.
- Every list endpoint is paginated with a max page size. Aggregate in SQL, not in app memory.
- Every new query ships with the index it needs, in a migration.
- Anything that may take >2s runs as a background job.

## Working rules for the AI
1. Read this file and the relevant spec in `docs/specs/` first.
2. PLAN before coding. Wait for approval of the plan.
3. Write/update tests for the acceptance criteria BEFORE implementation.
4. Work in small slices. One plan step per change.
5. Never add a dependency without asking (give name, downloads, last release, reason).
6. Never run DELETE / DROP / TRUNCATE / destructive migrations / force-push without explicit approval.
7. Never edit or delete a test to make it pass. If a test looks wrong, stop and say so.
8. Never claim it works unless you ran it. Paste the command and output.
9. If stuck after 2 attempts, stop and explain the root cause in words before changing more code.
10. After finishing, run `docs/REVIEW_CHECKLIST.md` against your own diff and report pass/fail per item.

## Domain rules
- [Business rules specific to this project, e.g. "debits must equal credits", "posted vouchers are immutable"]

## Decisions log (newest first)
- [YYYY-MM-DD] [decision and why]
