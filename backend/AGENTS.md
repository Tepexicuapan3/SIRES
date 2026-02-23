# AGENTS.md - Backend (Django/DRF) Ruleset

## Scope

- Applies to all files under `backend/`.
- If a deeper `AGENTS.md` exists, that file wins for its subtree.

## Load Narrow Context

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

## Backend Structure

- `backend/config/` - settings and root URLs.
- `backend/apps/` - domain apps.
- `backend/infrastructure/` - cross-cutting integrations.
- `backend/tests/` - backend tests and fixtures.

## Commands

```bash
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py test
```
