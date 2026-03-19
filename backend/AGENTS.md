# AGENTS.md - Backend (Django/DRF) Ruleset

## Scope

- Applies to all files under `backend/`.
- If a deeper `AGENTS.md` exists, that file wins for its subtree.

## Load Narrow Context

- `backend/domains/AGENTS.md` - target domain scaffolding and migration rules.
- `backend/apps/AGENTS.md` - endpoint/use-case/repository implementation details.
- `backend/tests/AGENTS.md` - backend testing workflow.

## Backend Skills

- `django-drf` - DRF implementation patterns.
- `api-design-principles` - API contract and versioning decisions.
- `error-handling-patterns` - error taxonomy, retries, fallback.
- `systematic-debugging` - root-cause-first debugging process.
- `brainstorming` - planning/discovery before implementation.
- `pytest` - backend test patterns.
- `find-skills` - discover/install skills when requested.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Design/review API contracts (resources, status codes, versioning, pagination) | `api-design-principles` |
| Implement Django/DRF endpoints (views, serializers, permissions, filters) | `django-drf` |
| Design/review error contracts and resilience behavior | `error-handling-patterns` |
| Debug backend bugs, test failures, and integration issues | `systematic-debugging` |
| User asks for planning/discovery before coding | `brainstorming` |
| Write backend tests | `pytest` |
| User asks to discover/install skills | `find-skills` |

## Critical Rules

- New backend features must be Django/DRF.
- Keep clean architecture boundaries: presentation, use_cases, repositories/infrastructure, domain.
- JWT auth must remain cookie-based (`HttpOnly` cookies).
- Mutating endpoints must enforce CSRF via `X-CSRF-TOKEN`.
- Keep API responses in camelCase when exposed to frontend.
- Keep API routes consistent under `api/v1/` and avoid trailing slash drift.
- DB strategy is domain-first: PostgreSQL is the target engine with `DB por dominio` ownership.
- Every table/schema/migration must have a single domain owner; avoid shared tables without explicit owner.
- No direct cross-domain SQL access from backend code (reads/writes); use API contracts, events, or read-models.

## Backend Structure

- `backend/config/` - settings and root URLs.
- `backend/apps/` - domain apps.
- `backend/domains/` - domain-first target structure (incremental scaffolding, no runtime cutover yet).
- `backend/infrastructure/` - cross-cutting integrations.
- `backend/tests/` - backend tests and fixtures.

## Incremental Migration Guardrails (`apps` -> `domains`)

- No mover modulos existentes en bloque; migrar por dominio piloto cerrado.
- Mantener rutas activas actuales en `backend/apps/` hasta cerrar DoD del dominio.
- Permitir wrappers/adapters temporales documentados para conectar `apps` con `domains`.
- Cada PR debe indicar estado del dominio: `legacy`, `hybrid`, o `domain-first`.
- La migracion de datos a PostgreSQL debe seguir `expand -> migrate -> contract` por dominio, sin corte big-bang.

## Commands

```bash
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py test
```
