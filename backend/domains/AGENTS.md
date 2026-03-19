# AGENTS.md - Backend Domain Scaffolding Rules

## Scope

- Applies to `backend/domains/`.
- This subtree defines the target backend structure by domain.

## Purpose

- Enable incremental migration from `backend/apps/` to domain-first modules.
- Avoid runtime breakage while teams move features by vertical slices.

## Rules

- Do not delete or rewrite legacy modules in `backend/apps/` as part of scaffolding tasks.
- Prefer additive changes: new domain packages, adapters, and docs.
- Keep domain boundaries explicit (`presentation`, `use_cases`, `infrastructure`, `domain`).
- Every domain change must update migration status in `docs/guides/incremental-domain-migration.md`.

## Suggested Domain Layout

```text
backend/domains/<domain>/
  presentation/
  use_cases/
  infrastructure/
  domain/
  tests/
```
