# AGENTS.md - SIRES Operating Guide

## How to Use This Guide

- Start here for cross-project norms. SIRES has several components.
- Each component has an `AGENTS.md` file with specific guidelines (e.g., `backend/AGENTS.md`, `frontend/AGENTS.md`).
- Component docs override this file when guidance conflicts.

## Project summary

SIRES is a clinical system. The frontend is React 19 + Vite and the backend has **completed the migration to Django 5 + DRF**. All new functionality must be designed for Django/DRF.

## Primary stack

| Component | Stack | Notes |
| --- | --- | --- |
| Frontend | React 19, TypeScript 5.9, Vite 7 | React Router 7, TanStack Query 5, Zustand 5, Zod 4, RHF, Radix/shadcn |
| Backend | Django 5 + DRF | Clean architecture |
| Data | MySQL, Redis | Redis for OTP/cache, MySQL as primary DB |
| UI | Tailwind 4, shadcn/ui, Radix | Metro CDMX tokens in `frontend/src/styles/theme.css` |
| Testing | Vitest, Testing Library, MSW, Playwright | Pytest for backend |
| Infra | Docker Compose | `frontend` 5173, `backend` 5000 |

## Available skills (SIRES)

| Skill | Recommended use | Path |
| --- | --- | --- |
| `react-19` | React components, hooks, compiler patterns | `.opencode/skill/react-19/SKILL.md` |
| `typescript` | Types, interfaces, strict generics | `.opencode/skill/typescript/SKILL.md` |
| `tailwind-4` | Tailwind styling + `cn()` | `.opencode/skill/tailwind-4/SKILL.md` |
| `zod-4` | Schemas and validation (Zod v4) | `.opencode/skill/zod-4/SKILL.md` |
| `zustand-5` | Stores, slices, persistence | `.opencode/skill/zustand-5/SKILL.md` |
| `django-drf` | ViewSets, serializers, filters | `.opencode/skill/django-drf/SKILL.md` |
| `pytest` | Python tests, fixtures, mocking | `.opencode/skill/pytest/SKILL.md` |
| `playwright` | E2E with Page Objects + MCP | `.opencode/skill/playwright/SKILL.md` |
| `jira-epic` | Large epics definition | `.opencode/skill/jira-epic/SKILL.md` |
| `jira-task` | Tasks/bugs definition | `.opencode/skill/jira-task/SKILL.md` |
| `skill-creator` | Create new skills | `.opencode/skill/skill-creator/SKILL.md` |

## Skills present but inactive

- `nextjs-15` and `ai-sdk-5` exist in the repo but are not used in SIRES today. Only invoke them if the project adopts Next.js or AI features.

## Auto-invoke (when to load skills)

| Action | Skill |
| --- | --- |
| Create/modify React components | `react-19` |
| Write TypeScript types | `typescript` |
| Tailwind styling | `tailwind-4` |
| Zod / RHF validation | `zod-4` |
| Create/edit global stores | `zustand-5` |
| Design Django/DRF APIs | `django-drf` |
| Backend Python tests | `pytest` |
| E2E tests | `playwright` |
| Create project epics | `jira-epic` |
| Create tasks/bugs | `jira-task` |
| Define a new skill | `skill-creator` |

## Backend rules (Django)

- All new features must be built in Django/DRF.
- Keep clean architecture: presentation (DRF views/serializers), use_cases (orchestration), infrastructure (DB, mail, cache), domain (entities and rules).
- JWT in HttpOnly cookies and CSRF via `X-CSRF-TOKEN` header.

## Development commands

### Frontend (Bun)
```bash
bun dev
bun build
bun lint
bun test
```

### Backend (Django)
```bash
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
```

### Docker (recommended)
```bash
docker-compose up --build
docker-compose down -v
docker-compose logs -f
```
