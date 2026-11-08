---
name: plan-feature
description: Produce an implementation plan for an approved spec, with no code, then wait for approval. Use before building any feature or when the user types /plan-feature.
---

# Plan a feature (no code)

1. Read `CLAUDE.md`, the spec in `docs/specs/`, and `docs/ARCHITECTURE.md`. If the spec has open questions, stop and ask them first.
2. Search the codebase for existing services, helpers, components and tables this feature should reuse. List what you found.
3. Write the plan into `docs/specs/<feature>.plan.md`:
   - **Reuse:** existing code to extend (file:function).
   - **Data model:** tables, columns, types, constraints, indexes, migration (reversible).
   - **Endpoints:** for each one — method, path, who may call it, scope check, validation, transaction boundary.
   - **Concurrency:** for every write, what happens if two requests run at once, and how it is prevented.
   - **Performance:** number of queries per endpoint, pagination, what runs as a background job.
   - **Security:** how each spec role is enforced on the server.
   - **New dependencies:** none, or each with name, weekly downloads, last release, reason.
   - **Tests:** list of tests mapped to acceptance criteria, written before the code.
   - **Steps:** numbered small slices, each with a "done when" check. Each slice must be reviewable on its own.
   - **Risks:** what could go wrong and the fallback.
4. Show the user the plan summary and STOP. Do not write code until the user approves.
