# AGENTS.md - Frontend Features Guide

## Scope

- Applies to `frontend/src/features/**`.
- If it conflicts with `frontend/AGENTS.md`, this file wins.

## Skills Reference

- `vercel-react-best-practices` - feature UI performance patterns.
- `interface-design` - screen/layout design before implementation.
- `web-design-guidelines` - accessibility and UX quality review.
- `typescript` - strict feature typing.
- `zod-4` - form and contract validation.
- `zustand-5` - feature/global UI state.
- `error-handling-patterns` - user-facing error and fallback behavior.
- `systematic-debugging` - root-cause-first debugging.
- `brainstorming` - planning and scope before coding.
- `find-skills` - discover/install skills when requested.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Build or refactor feature components | `vercel-react-best-practices` |
| Define new feature UI direction before coding | `interface-design` |
| Audit feature UI/UX/accessibility | `web-design-guidelines` |
| Write feature types/contracts | `typescript` |
| Implement feature validations (forms/contracts) | `zod-4` |
| Add/edit feature state stores | `zustand-5` |
| Design/review error states and fallback UX | `error-handling-patterns` |
| Debug feature regressions and failing tests | `systematic-debugging` |
| User asks for planning/discovery before coding | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

## Feature Rules

- Keep feature boundaries clear: `pages/`, `components/`, `queries/`, `mutations/`, `domain/`, `utils/`.
- UI must not call HTTP directly; use hooks/resources from `frontend/src/api/`.
- Separate queries and mutations by module with dedicated query keys.
- Place reusable pieces in `frontend/src/components/`; keep feature-specific pieces local.

## Architecture Guardrails

- Treat feature `components/` and `pages/` as presentation layer.
- Keep orchestration/business flows in `queries/`, `mutations/`, and `domain/`.
- Place permission/contextual rules in policy-like helpers under `domain/`, not inline in JSX.
- Hard ban: critical business logic in `utils/` catch-all helpers.

## Pattern Guidance

- Use feature use-case style hooks to coordinate multi-step operations.
- Use repository-like wrappers only when multiple API resources need unified behavior.
- Prefer internal state events or query invalidation before adding external messaging mechanisms.
- Avoid premature complexity: no microfrontend splits or CQRS-style architecture in feature modules by default.

## Permission UX Rules

- If a secondary catalog is blocked by permissions, show neutral contextual notice (not critical/red banner).
- Keep user-facing copy minimal; never expose raw permission codes.
- Disable only dependent controls and keep read-only data visible when possible.
- Prevent unnecessary unauthorized calls with query `enabled: false`.

## Permission Dependency Model

- Permission dependencies live in `frontend/src/features/auth/domain/permission-dependencies.ts`.
- For write actions, use dependency-aware checks via `usePermissionDependencies()`.
- If adding a permission, update dependency rules and tests in `frontend/src/test/unit/auth/permission-dependencies.test.ts`.
- Use `dependencyAware` mode in `PermissionGate` or `ProtectedRoute` when UX requires full capability.

## Part 2 Guardrails (Operational)

- Cross-feature/domain flows must go through contracts, explicit orchestration hooks, or documented events; no direct internal coupling.
- Real-time is a controlled exception; keep handlers in dedicated adapters and delegate business decisions to feature/domain application logic.
- For sensitive actions, propagate correlation metadata (`X-Request-ID` when available) so backend audit remains traceable.
- Feature permission checks are UX-only; backend authorization is final and must map to atomic permissions/policies.

## Part 3 Guardrails (Operational)

- Keep backend data-strategy awareness in feature contracts: do not design UI flows that depend on implicit cross-domain DB joins; require explicit backend contract composition.
- Collaboration baseline: update feature/domain docs and DoD notes in the same PR when flow boundaries, permissions, or critical contracts change.
- Use risk-based tests: prioritize auth/authz UX gates, audit-traceable actions, critical transitions, and concurrency-prone state changes.
- Stage-based evolution only: improve current modular monolith boundaries incrementally; avoid rewrite-first architecture moves.
- Top risks to avoid: hidden coupling in `utils/`, unverified critical flows, and complexity added without measurable need.

## QA Checklist

- [ ] Feature follows module boundaries.
- [ ] No direct HTTP in UI components.
- [ ] Query/mutation separation is clear.
- [ ] Permission states are handled without noisy UX.
- [ ] Dependency-aware permission checks are used where needed.
- [ ] Cross-domain interactions use explicit contracts/orchestration/events.
- [ ] Real-time paths (if any) avoid business/security decisions in handlers.
- [ ] Sensitive flows keep backend audit traceability metadata.
- [ ] Critical user journeys have proportional automated tests by risk.
- [ ] Flow/contract changes updated related docs in the same PR.
