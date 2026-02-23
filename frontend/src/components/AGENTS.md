# AGENTS.md - SIRES UI Components Ruleset

## How to Use This Guide

- Applies only to `frontend/src/components/`.
- If it conflicts with `frontend/AGENTS.md`, this guide wins.

## Skills Reference

- `vercel-react-best-practices` - Performance-aware component patterns
- `interface-design` - UI layout and visual hierarchy design
- `web-design-guidelines` - UI/UX and accessibility compliance reviews
- `tailwind-4` - Styling conventions
- `typescript` - Component props typing
- `error-handling-patterns` - component-level error/empty/fallback states
- `systematic-debugging` - Root-cause-first debugging for UI regressions
- `brainstorming` - planning component composition before coding
- `find-skills` - Discover/install skills when requested

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Create/modify React components (performance-aware) | `vercel-react-best-practices` |
| Create new UI component composition/layout direction | `interface-design` |
| Review UI/UX/accessibility compliance | `web-design-guidelines` |
| Tailwind styling | `tailwind-4` |
| Write TypeScript types | `typescript` |
| Design/review error and fallback states in UI components | `error-handling-patterns` |
| Debug UI bugs and regressions | `systematic-debugging` |
| User asks for planning/discovery before coding | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

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
