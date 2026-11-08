# Architecture — decided once, at kickoff

> Fill this in before the first feature. The AI follows it; it does not invent it.

## Stack
- Frontend:
- Backend:
- Database:
- Auth:
- Hosting / environments: dev (local), staging, production — separate databases, AI only has dev credentials

## Layers
```
UI (display only)
  -> API route / controller   (auth, input validation, calls one service)
    -> service                (business rules, transactions)
      -> repository           (all SQL / ORM calls)
        -> database           (constraints enforce invariants)
```

## Folder map
```
src/
  routes/        # thin: parse, authorize, call service
  services/      # business logic
  repositories/  # data access only
  jobs/          # background work
  lib/           # shared helpers (money, dates, errors, auth)
tests/
docs/specs/
```

## Cross-cutting decisions
- Auth & roles:
- Scope rule (tenant / branch / owner):
- Error format returned by the API:
- Logging & audit trail:
- Money type:
- Date/time & time zone:
- Pagination style:
- Background job runner:

## Scale assumptions
- Concurrent users:
- Largest table and rows/year:
- Slowest expected report:
