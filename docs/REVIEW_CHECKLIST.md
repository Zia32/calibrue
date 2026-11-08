# Review checklist — run against every diff before merge

Answer each line PASS / FAIL / N/A with the file:line that proves it.
The AI runs this on its own diff (rule 10 in CLAUDE.md); you re-run it in a FRESH chat
with `/review` so the reviewer is not defending its own work.

## Security
- [ ] Every new/changed endpoint checks: authenticated, role allowed, record in user's scope
- [ ] Tried the endpoint logged-out and as a user of another scope -> 401/403
- [ ] No string-built SQL; all queries parameterized / ORM
- [ ] User input validated on the server (type, length, range) and escaped on output
- [ ] No secrets, keys or tokens in code, logs or client bundle
- [ ] No sensitive data in URLs, logs or error messages shown to users

## Data integrity & concurrency
- [ ] Multi-step writes wrapped in a single transaction
- [ ] Invariants backed by DB constraints (unique / FK / NOT NULL / CHECK)
- [ ] No read-modify-write race (use atomic UPDATE, row lock, or version column)
- [ ] Sequential numbers from DB sequence / locked counter, not MAX+1
- [ ] Create/payment endpoints idempotent (idempotency key or unique constraint)
- [ ] Money as DECIMAL / integer minor units, never float
- [ ] Migration is reversible and does not lose data

## Performance & scale
- [ ] No queries or HTTP calls inside loops (no N+1)
- [ ] Every list paginated with a max page size
- [ ] Aggregation done in SQL, not by loading rows into memory
- [ ] Index added for every new WHERE / JOIN / ORDER BY column
- [ ] Slow work (>2s: reports, exports, emails, imports) in a background job
- [ ] Tested with realistic data volume, not 5 rows

## Correctness & maintainability
- [ ] Every acceptance criterion in the spec has a test, and tests pass (output pasted)
- [ ] Edge cases from the spec covered: empty, invalid, duplicate, concurrent, unauthorized
- [ ] No empty `catch` / swallowed errors
- [ ] No duplicated business logic (searched for existing helpers first)
- [ ] Follows the layers in CLAUDE.md (no SQL in routes/UI, no rules in UI)
- [ ] No file grew past ~300 lines without a reason
- [ ] No new dependency without approval; each one verified to exist and be maintained
- [ ] No existing test edited/deleted to make it pass

## Docs
- [ ] Spec status updated; CLAUDE.md decisions log updated if a design choice was made

## Verdict
Top 3 risks, highest first:
1.
2.
3.
