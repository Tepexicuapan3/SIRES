# AGENTS.md - SIRES Frontend Routes Ruleset

## How to Use This Guide

- Applies only to `frontend/src/routes/`.
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

- Route guards live in `frontend/src/routes/` (no guards in pages).
- Keep routes declarative; business logic lives in features/use cases.
- Protected routes must enforce auth and permissions.
- Route modules live in `frontend/src/routes/modules/` (grouped by domain).
- Lazy loading must be applied per module (not per page).

---

## QA Checklist

- [ ] New route is registered
- [ ] Guard applied when needed
- [ ] Route points to feature component
