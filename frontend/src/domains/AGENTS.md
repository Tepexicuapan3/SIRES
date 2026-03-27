# AGENTS.md - Frontend Domain Scaffolding Rules

## Scope

- Applies to `frontend/src/domains/`.
- Defines target frontend structure per domain.

## Purpose

- Organize frontend work by domain ownership without breaking current routes/features.
- Support coexistence with `frontend/src/features/` during migration.

## Rules

- Do not perform big-bang moves from `features` to `domains`.
- Keep UI/API boundaries: HTTP stays in `frontend/src/infrastructure/api/resources/`.
- Prefer additive extraction of domain modules and adapters.
- Update migration tracker in `docs/guides/incremental-domain-migration.md` when moving components.

## Responsibilities by Layer

- `components/` and `pages/`: presentation concerns only.
- `hooks/`: application orchestration and flow control.
- `state/`: domain state and event-style transitions.
- `adapters/`: integration mapping and anti-corruption between contracts.
- `types/`: domain contracts and policy-friendly type models.

## Anti-pattern Bans

- Do not place critical business rules inside `components/` or generic UI helpers.
- Do not call HTTP directly from domain components/pages.
- Do not create cross-domain imports that bypass contracts.
- Do not create catch-all shared `utils` with domain business decisions.

## Part 2 Operational Guardrails

- Inter-domain interaction must use API contracts, explicit domain adapters, or documented domain events.
- Real-time is a controlled exception; keep socket/event handlers thin and delegate business decisions to `hooks/` or domain modules.
- For critical user actions, propagate correlation metadata (for example `X-Request-ID`) to support backend audit traceability.
- Permission checks in client are UX gating only; enforce atomic permissions through centralized policy contracts and keep backend as security truth.

## Part 2 Checklist

- [ ] No direct cross-domain internal imports bypassing contracts.
- [ ] Real-time handlers (if any) delegate business logic to application/domain layers.
- [ ] Sensitive flows propagate audit correlation metadata.
- [ ] Permission gating uses policy contracts, not ad-hoc role strings.

## Part 3 Guardrails

- Respect backend DB strategy in contracts: one operational PostgreSQL source now with strict domain ownership/logical isolation; frontend must not assume cross-domain table access semantics.
- Keep collaboration discipline: when domain boundaries/contracts move, update migration docs and DoD artifacts in the same PR.
- Apply risk-based testing for domain slices: prioritize authz UX gates, audit metadata propagation, critical state transitions, and race-prone UI flows.
- Follow stage-based evolution: incremental extraction from `features` first, optimization/hardening second, no rewrite-by-hype.
- Top risks to avoid: hidden cross-domain coupling, business rules in presentation, and untested critical permission paths.

## Part 3 Checklist

- [ ] Contract changes do not assume cross-domain DB shortcuts.
- [ ] Boundary/DoD docs were updated with the implementation.
- [ ] Critical flows have proportional automated coverage by risk.
- [ ] Migration stayed incremental (no big-bang move).

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
