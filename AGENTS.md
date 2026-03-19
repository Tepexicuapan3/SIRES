# AGENTS.md - SIRES Operating Guide

## Scope

- Base guide for the whole repository.
- More specific `AGENTS.md` files override this guide for their subtree.

## Project Snapshot

SIRES is a clinical system with React 19 + Vite on frontend and Django 5 + DRF on backend.
All new backend functionality must be built for Django/DRF.

## Operating Baseline (Phase 1)

- Official strategy: evolutionary modular monolith + `DB por dominio` with PostgreSQL as target engine.
- Mandatory delivery flow: Jira ticketing + SDD phases + Engram persistence + GGA pre-commit gate.
- Runtime remains on current routes/modules until each domain reaches DoD (no big-bang cutover).
- Auth functional refactor starts only after planning artifacts and Jira acceptance criteria are ready.

## Scoped Guides (Load Narrow Context First)

- `backend/AGENTS.md` - backend-wide rules
- `backend/domains/AGENTS.md` - domain scaffolding backend (target structure)
- `backend/apps/AGENTS.md` - endpoint/use-case/repository implementation
- `backend/tests/AGENTS.md` - backend testing workflow
- `frontend/AGENTS.md` - frontend-wide rules
- `frontend/src/domains/AGENTS.md` - domain scaffolding frontend (target structure)
- `frontend/src/api/AGENTS.md` - API client/contracts in frontend
- `frontend/src/components/AGENTS.md` - shared UI/component rules
- `frontend/src/features/AGENTS.md` - feature-module rules
- `frontend/src/features/admin/AGENTS.md` - admin feature specifics
- `frontend/src/routes/AGENTS.md` - routing/guards
- `frontend/src/test/AGENTS.md` - frontend testing workflow
- `docs/AGENTS.md` - docs-wide rules
- `docs/api/AGENTS.md` - API documentation contracts

## Domain-First Operating Model (Phase 1 + base Phase 2)

- Delivery se organiza por dominios con ownership explicito (backend + frontend + DB + docs por dominio).
- No hacer big-bang moves: coexistencia `old` y `new` hasta cerrar dominios piloto.
- Rutas/runtime actuales son la fuente operativa; nuevas estructuras se introducen como scaffolding gradual.
- Estrategia de datos obligatoria: `DB por dominio` con PostgreSQL como tecnologia objetivo por escalabilidad.
- Aislamiento de datos por dominio: primero logico (schema/namespace ownership), luego fisico (DB dedicada) segun criterios documentados.
- Prohibido el acceso directo cross-domain a tablas o schemas de otro dominio; usar contratos (API/eventos/read-models).
- Cambios cross-domain requieren RFC corto y PR con checklist de impacto.

### Canonical domain docs

- `docs/architecture/domain-map.md`
- `docs/architecture/context-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/repo-navigation-map.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`
- `docs/guides/incremental-domain-migration.md`
- `docs/templates/rfc-cross-domain-template.md`

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

## Engram Protocol (Mandatory Repo Baseline)

This is the minimum required Engram protocol at repository level and applies even if local/global agent setup is missing or different.

### Session Start (before coding, when applicable)

- Review prior context before starting work on an existing topic/feature/bug.
- Use `mem_context` and/or `mem_search` on `project: SIRES_SHARED` before starting when prior team context may exist.
- Use `project: SIRES_LOCAL` only when you need your own local continuity.
- If `mem_search` returns a match, call `mem_get_observation` before acting on it (search results may be truncated).

### During Work (mandatory saves)

- Use `mem_save` immediately after high-signal events that matter to the team:
  - architecture/design decisions with cross-team impact
  - bug fixes with root cause and prevention notes
  - shared conventions/patterns that others must follow
  - config/environment changes that affect other developers
- Save shared items with `project: SIRES_SHARED` (this project is exported to `.engram/`).
- Save temporary/local notes with `project: SIRES_LOCAL` and `scope: personal`.
- Do not save routine low-value progress updates to `SIRES_SHARED`.

### Session Close (mandatory)

- Before ending the session, call `mem_session_summary` with goal, discoveries, accomplished work, next steps, and relevant files.

### Non-SDD `topic_key` Convention (mandatory)

- Reuse stable keys (upsert behavior) for ongoing work on the same topic to avoid duplicated observations.
- Create new keys only when the topic actually changes.
- Required key patterns:
  - `feature/{slug}/decision`
  - `feature/{slug}/progress`
  - `bug/{id-or-slug}/fix`
  - `ops/{area}/config`
  - `docs/{topic}/note`

### Operational Checklist

- Start: `mem_context`/`mem_search` on `SIRES_SHARED`; check `SIRES_LOCAL` only if needed.
- During: `mem_save` to `SIRES_SHARED` only for high-signal team decisions; keep local noise in `SIRES_LOCAL`.
- Search safety: after `mem_search`, use `mem_get_observation` for full content.
- Close: `mem_session_summary` before handing off or ending the session.

### Team Sync Automation

- One-time per clone: run `./.engram/scripts/install-hooks.sh`.
- `commit-msg` hook auto-exports shared memory via `engram sync --project SIRES_SHARED` and stages `.engram/` updates.
- `post-merge`, `post-checkout`, and `post-rewrite` hooks auto-import with `engram sync --import`.

### GGA Code Review Automation

- The project includes repo-local GGA config in `.gga/gga/config` and rules in `.gga/rules.md`.
- `pre-commit` hook runs `./.gga/scripts/gga.sh run` through `.githooks/pre-commit` on every commit.
- Each developer must install GGA globally once (`brew install gentleman-programming/tap/gga` or manual install) so the hook can execute.

## Backend Guardrails

- Keep clean architecture: presentation (views/serializers), use_cases, infrastructure, domain.
- JWT must stay in HttpOnly cookies.
- CSRF must be enforced via `X-CSRF-TOKEN` for mutating requests.
- Data ownership rule: each domain owns its PostgreSQL data model and migrations.
- Data access rule: no direct cross-domain table/schema reads or writes from application code.

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
docker compose up --build
docker compose down
# usar down -v solo para reset explicito de datos
docker compose logs -f
```
