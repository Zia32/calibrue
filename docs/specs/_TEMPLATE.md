# Spec: [Feature name]

Status: Draft | Approved | Built
Owner: [you]

## 1. Goal
[One or two sentences: what problem this solves and for whom.]

## 2. Users & permissions
| Role | Can view | Can create/edit | Can approve/delete |
|------|----------|-----------------|--------------------|
| [role] | | | |

Scope rule: [e.g. users only see records of their own branch]

## 3. Business rules
1. [Rule — be exact. Formulas with a worked example.]
2. [...]

## 4. Data
- New/changed tables & columns (with types, constraints):
- Invariants enforced in the DB:
- Expected volume: [rows/year, growth]

## 5. Flows
1. [Step-by-step happy path]

## 6. Edge cases (the AI will NOT think of these unless listed)
- Empty / invalid / huge input:
- Two users doing this at the same time:
- Double click / retry / network drop mid-request:
- User without permission tries it (UI and direct API call):
- Partial failure halfway through:
- [Domain-specific: closed period, reversed record, deleted parent, ...]

## 7. Non-functional
- Performance target: [e.g. list loads <500ms with 100k rows]
- Audit/logging needed:
- Background jobs:

## 8. Acceptance criteria (become tests)
- [ ] Given ..., when ..., then ...
- [ ] Unauthorized user gets 403 on direct API call
- [ ] 20 parallel requests produce correct result (no duplicates / lost updates)

## 9. Out of scope
- [What we are deliberately NOT building now]

## 10. Open questions
- [ ]
