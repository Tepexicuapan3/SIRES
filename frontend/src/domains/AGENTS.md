# AGENTS.md - Frontend Domain Scaffolding Rules

## Scope

- Applies to `frontend/src/domains/`.
- Defines target frontend structure per domain.

## Purpose

- Organize frontend work by domain ownership without breaking current routes/features.
- Support coexistence with `frontend/src/features/` during migration.

## Rules

- Do not perform big-bang moves from `features` to `domains`.
- Keep UI/API boundaries: HTTP stays in `frontend/src/api/resources/`.
- Prefer additive extraction of domain modules and adapters.
- Update migration tracker in `docs/guides/incremental-domain-migration.md` when moving components.

## Suggested Domain Layout

```text
frontend/src/domains/<domain>/
  components/
  hooks/
  pages/
  state/
  adapters/
  types/
```
