# AGENTS.md - Frontend Source Onboarding Guide

## Scope

- Applies to `frontend/src/**`.
- If a deeper `AGENTS.md` exists, that file wins for its subtree.

## Purpose

- Provide quick onboarding for contributors touching React runtime code.
- Reinforce architecture boundaries and folder ownership at source-root level.

## Mandatory Delivery Workflow (Checklist)

- [ ] Jira ticket exists with clear acceptance criteria.
- [ ] SDD artifacts are current for the change phase (proposal/spec/design/tasks/apply/verify).
- [ ] Relevant decisions/discoveries are persisted in Engram (`SIRES_SHARED`).
- [ ] Engram saves use required `topic_key` convention (`feature/{slug}/decision`, `feature/{slug}/progress`, `bug/{id-or-slug}/fix`, `ops/{area}/config`, `docs/{topic}/note`).
- [ ] GGA pre-commit checks pass before PR/merge.
- [ ] NEW feature/NEW functionality/LARGE refactor uses tests-first planning and Red -> Green -> Refactor execution evidence.

## Architecture Guardrails (Part 1-3 baseline)

- Keep modular-monolith + pragmatic DDD boundaries even in frontend modules.
- Respect layered responsibilities:
  - `presentation`: components, pages, routes.
  - `application`: hooks/use-cases and orchestration.
  - `domain`: business rules/policies/types.
  - `infrastructure`: API clients/adapters/integration utilities.
- Critical business rules must not live in JSX, route guards, or shared UI helpers.

## Folder Ownership

- Domain-first target: `frontend/src/domains/<domain>/{components,hooks,pages,state,adapters,types}`.
- Feature-specific UI stays in `frontend/src/features/<feature>/`.
- Shared modules must remain technical (`components/ui`, API primitives, telemetry), not business-rule containers.

## Inter-domain, Real-time, and Authorization Guardrails (Part 2)

- Inter-domain communication in frontend must use explicit contracts/adapters/events only.
- Do not bypass domain boundaries through direct cross-domain imports of internal state/models.
- Real-time is a controlled exception: use dedicated modules/contracts and keep handlers thin.
- WebSocket/event handlers must delegate business decisions to application/domain hooks.
- Frontend permission checks are UX gating only; backend authorization remains source of truth.
- Do not use ad-hoc role-string checks in components/routes as security enforcement.

## Audit Awareness (Frontend)

- For sensitive UX flows, propagate correlation metadata required by backend audit (`X-Request-ID` when applicable).
- Never treat client-side logs/events as canonical audit persistence.

## Start Here

- `frontend/AGENTS.md`
- `frontend/src/domains/AGENTS.md`
- `frontend/src/features/AGENTS.md`
- `frontend/src/routes/AGENTS.md`
- `frontend/src/test/AGENTS.md`
