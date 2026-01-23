# AGENTS.md - SIRES Frontend Routes Ruleset

## How to Use This Guide

- Applies only to `frontend/src/routes/`.
- If it conflicts with `frontend/AGENTS.md`, this guide wins.

## Skills Reference

- `react-19` - Component patterns
- `typescript` - Route typing

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Create/modify React components | `react-19` |
| Write TypeScript types | `typescript` |

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
