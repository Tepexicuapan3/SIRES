# AGENTS.md - SIRES Operating Guide

## Scope

- Base guide for the whole repository.
- More specific `AGENTS.md` files override this guide for their subtree.

## Project Snapshot

SIRES is a clinical system with React 19 + Vite on frontend and Django 5 + DRF on backend.
All new backend functionality must be built for Django/DRF.

## Scoped Guides (Load Narrow Context First)

- `backend/AGENTS.md` - backend-wide rules
- `backend/apps/AGENTS.md` - endpoint/use-case/repository implementation
- `backend/tests/AGENTS.md` - backend testing workflow
- `frontend/AGENTS.md` - frontend-wide rules
- `frontend/src/api/AGENTS.md` - API client/contracts in frontend
- `frontend/src/components/AGENTS.md` - shared UI/component rules
- `frontend/src/features/AGENTS.md` - feature-module rules
- `frontend/src/features/admin/AGENTS.md` - admin feature specifics
- `frontend/src/routes/AGENTS.md` - routing/guards
- `frontend/src/test/AGENTS.md` - frontend testing workflow
- `docs/AGENTS.md` - docs-wide rules
- `docs/api/AGENTS.md` - API documentation contracts

## Active Skills (SIRES)

| Skill | Recommended use | Path |
| --- | --- | --- |
| `vercel-react-best-practices` | React performance and refactoring patterns | `.opencode/skill/vercel-react-best-practices/SKILL.md` |
| `interface-design` | Create intentional UI layouts and visual hierarchy | `.opencode/skill/interface-design/SKILL.md` |
| `web-design-guidelines` | UI/UX and accessibility review against web guidelines | `.opencode/skill/web-design-guidelines/SKILL.md` |
| `typescript` | Types, interfaces, strict generics | `.opencode/skill/typescript/SKILL.md` |
| `tailwind-4` | Tailwind styling + `cn()` | `.opencode/skill/tailwind-4/SKILL.md` |
| `zod-4` | Schemas and validation (Zod v4) | `.opencode/skill/zod-4/SKILL.md` |
| `zustand-5` | Stores, slices, persistence | `.opencode/skill/zustand-5/SKILL.md` |
| `django-drf` | DRF endpoints, serializers, permissions, filters | `.opencode/skill/django-drf/SKILL.md` |
| `api-design-principles` | REST API contract and versioning design | `.opencode/skill/api-design-principles/SKILL.md` |
| `error-handling-patterns` | Error taxonomy, contracts, retries, fallback | `.opencode/skill/error-handling-patterns/SKILL.md` |
| `systematic-debugging` | Root-cause-first workflow for bugs and regressions | `.opencode/skill/systematic-debugging/SKILL.md` |
| `brainstorming` | Plan and scope features before implementation | `.opencode/skill/brainstorming/SKILL.md` |
| `pytest` | Python tests, fixtures, mocking | `.opencode/skill/pytest/SKILL.md` |
| `playwright` | E2E with Page Objects + MCP | `.opencode/skill/playwright/SKILL.md` |
| `jira-epic` | Large epics definition | `.opencode/skill/jira-epic/SKILL.md` |
| `jira-task` | Tasks/bugs definition | `.opencode/skill/jira-task/SKILL.md` |
| `find-skills` | Discover/install skills when requested | `.opencode/skill/find-skills/SKILL.md` |

## Auto-invoke Matrix

| Action | Skill |
| --- | --- |
| Create/modify React components (performance-aware) | `vercel-react-best-practices` |
| Create new UI screens/layout direction before implementation | `interface-design` |
| Review UI/UX/accessibility compliance | `web-design-guidelines` |
| Write TypeScript types | `typescript` |
| Tailwind styling | `tailwind-4` |
| Zod / RHF validation | `zod-4` |
| Create/edit global stores | `zustand-5` |
| Design Django/DRF APIs | `django-drf` |
| Design/review API contracts and standards | `api-design-principles` |
| Design/review error contracts, retries, and fallback behavior | `error-handling-patterns` |
| Debug bugs, test failures, and regressions | `systematic-debugging` |
| User asks for planning/discovery before coding | `brainstorming` |
| Backend Python tests | `pytest` |
| E2E tests | `playwright` |
| Create project epics | `jira-epic` |
| Create tasks/bugs | `jira-task` |
| User asks to discover/install skills | `find-skills` |

## Backend Guardrails

- Keep clean architecture: presentation (views/serializers), use_cases, infrastructure, domain.
- JWT must stay in HttpOnly cookies.
- CSRF must be enforced via `X-CSRF-TOKEN` for mutating requests.

## Development Commands

### Frontend (Bun)
```bash
bun dev
bun lint
bun test
```

### Backend (Django)
```bash
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py test
```

### Docker (recommended)
```bash
docker-compose up --build
docker-compose down -v
docker-compose logs -f
```
