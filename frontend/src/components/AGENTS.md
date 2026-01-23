# AGENTS.md - SIRES UI Components Ruleset

## How to Use This Guide

- Applies only to `frontend/src/components/`.
- If it conflicts with `frontend/AGENTS.md`, this guide wins.

## Skills Reference

- `react-19` - Component patterns
- `tailwind-4` - Styling conventions
- `typescript` - Component props typing

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Create/modify React components | `react-19` |
| Tailwind styling | `tailwind-4` |
| Write TypeScript types | `typescript` |

---

## Critical Rules - Non-negotiable

### shadcn/ui
- Use shadcn primitives as the base for UI components.
- Keep shadcn components in `components/ui/`.
- Do not hardcode colors; use Metro CDMX tokens.

### Tokens
- Use `frontend/src/styles/theme.css` as the source of truth.
- Prefer semantic tokens (`bg-brand`, `txt-body`, `status-critical`).

### Component Placement
- Generic primitives -> `components/ui/`.
- Reusable non-primitive components -> `components/shared/`.
- Feature-specific components -> `features/<feature>/components/`.

---

## Decision Trees

### Component Type
```
Primitive UI -> components/ui/
Reusable shared -> components/shared/
Feature-only -> features/<feature>/components/
```

### Styling Approach
```
Static classes -> className
Conditional classes -> cn()
Dynamic values -> style prop
```

---

## QA Checklist

- [ ] Uses Metro CDMX tokens
- [ ] No hardcoded colors or `var()` in className
- [ ] Component placed in the correct folder
- [ ] Props typed with TypeScript
