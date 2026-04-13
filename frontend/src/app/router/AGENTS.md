# AGENTS.md - SISEM Frontend Routes Ruleset

## How to Use This Guide

- Applies only to `frontend/src/app/router/`.
- If it conflicts with `frontend/AGENTS.md`, this guide wins.

## Skills Reference

- `vercel-react-best-practices` - Performance-aware component patterns
- `interface-design` - UI layout and visual hierarchy design
- `web-design-guidelines` - UI/UX and accessibility compliance reviews
- `typescript` - Route typing
- `error-handling-patterns` - route error boundaries and fallback behavior
- `systematic-debugging` - Root-cause-first debugging for routing and guard issues
- `brainstorming` - planning navigation/guard strategy before coding
- `find-skills` - Discover/install skills when requested

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Create/modify React components (performance-aware) | `vercel-react-best-practices` |
| Create new page layout and route-level UI structure | `interface-design` |
| Review UI/UX/accessibility compliance | `web-design-guidelines` |
| Write TypeScript types | `typescript` |
| Design/review route error boundaries and fallback flows | `error-handling-patterns` |
| Debug route/guard regressions | `systematic-debugging` |
| User asks for planning/discovery before coding | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

---

## Critical Rules - Non-negotiable

- Route guards live in `frontend/src/app/router/guards/` (no guards in pages).
- Keep routes declarative; business logic lives in features/use cases.
- Protected routes must enforce auth and permissions.
- Route modules live in `frontend/src/app/router/modules/` (grouped by domain).
- Lazy loading must be applied per module (not per page).

## Part 2 Guardrails (Operational)

- Route-level cross-domain checks must rely on explicit policy/contracts, not direct internal imports from other domains.
- Real-time navigation updates are a controlled exception; handlers must stay thin and delegate business/security decisions to application/domain modules.
- For sensitive route transitions/actions, preserve request correlation metadata for backend audit traceability.
- Route authz in client is UX gating only; backend atomic permissions are the security source of truth.

## Part 3 Guardrails (Operational)

- Route contracts must not assume cross-domain DB shortcuts; depend on explicit backend contracts aligned with staged PostgreSQL ownership/isolation.
- Keep collaboration/DoD discipline: when guard boundaries or protected flows change, update routing docs and governance references in the same PR.
- Apply risk-based tests first to guard branches, protected transitions, authz degradation paths, and race-prone navigation flows.
- Follow stage-based evolution: incremental route-module hardening, no rewrite-first routing architecture changes.
- Top risks to avoid: security logic in ad-hoc route utils, untested guard edge cases, and hidden coupling across modules.

---

## QA Checklist

- [ ] New route is registered
- [ ] Guard applied when needed
- [ ] Route points to feature component
- [ ] Guard logic uses policy/dependency contracts (no ad-hoc role strings)
- [ ] Real-time route hooks (if any) do not contain critical business logic
- [ ] Sensitive flows keep backend audit correlation metadata
- [ ] Critical route/guard paths include proportional automated tests by risk
- [ ] Guard/flow boundary changes updated docs in the same PR
