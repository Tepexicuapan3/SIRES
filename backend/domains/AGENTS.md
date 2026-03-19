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

## Layer Responsibilities (Scaffolding Contract)

- `presentation/`: DRF transport adapter only.
- `use_cases/`: application services and transaction orchestration.
- `domain/`: business invariants, policies, value objects, entities.
- `infrastructure/`: repository implementations and external adapters.
- `tests/`: domain-focused and application integration tests.

## Anti-pattern Bans

- No critical business logic in `presentation/`.
- No cross-domain direct DB access from `use_cases/` or `infrastructure/`.
- No catch-all shared `utils` with domain decisions.
- No speculative full CQRS/event-sourcing setup during scaffolding.

## Part 2 Operational Guardrails

- Inter-domain communication must use only service/query contracts, application orchestrators, or internal domain events.
- Real-time is a controlled exception: keep handlers thin and delegate critical behavior to `use_cases/`.
- Critical operations must emit audit data with the minimum contract (`actor`, `timestamp`, `action`, `domain`, `resource`, `result`, `contextId/requestId`).
- Authorization must use atomic permissions and centralized policies; backend remains the source of truth.

## Part 2 Checklist

- [ ] Cross-domain interactions use contract/orchestrator/event only.
- [ ] Real-time logic (if present) does not contain business decisions.
- [ ] Critical operations include audit fields and mutation snapshots when applicable.
- [ ] Policy checks use atomic permissions (no ad-hoc role strings).

## Part 3 Guardrails

- DB baseline for this subtree: one operational PostgreSQL engine/instance now, with strict domain ownership and logical isolation; evaluate physical DB separation only with documented criteria.
- Every new domain persistence change must document integrity controls (PK/FK, uniqueness, nullability, indexes), transaction boundary in `use_cases/`, and concurrency strategy for hotspot flows.
- Keep architecture docs and migration status live in the same PR; do not split boundary changes from documentation updates.
- Apply risk-based tests per slice: prioritize authz/audit paths, critical state transitions, and concurrency-sensitive behavior before merge.
- Follow stage-based evolution: additive scaffolding first, hardening second, physical split only when evidence exists.

## Part 3 Checklist

- [ ] DB notes keep staged PostgreSQL wording (single operational source now, physical split later by criteria).
- [ ] Persistence changes document integrity, transaction boundary, and concurrency handling.
- [ ] Domain DoD and migration docs were updated in the same PR.
- [ ] Critical domain flows include proportional automated tests by risk.
- [ ] No hype-driven architecture jump (big-bang rewrite/microservice split/CQRS-by-default).

## Suggested Domain Layout

```text
backend/domains/<domain>/
  presentation/
  use_cases/
  infrastructure/
  domain/
  tests/
```
