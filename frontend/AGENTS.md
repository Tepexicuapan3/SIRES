# AGENTS.md - SIRES Frontend Ruleset

## How to Use This Guide

- Applies only to changes inside `frontend/`.
- If it conflicts with the root `AGENTS.md`, this guide wins.

## Skills Reference

Use these skills for detailed patterns:

- `react-19` - React component patterns
- `typescript` - Strict TS types
- `tailwind-4` - Tailwind and `cn()`
- `zod-4` - Zod v4 validation
- `zustand-5` - UI state management
- `playwright` - E2E testing

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Create/modify React components | `react-19` |
| Write TypeScript types | `typescript` |
| Tailwind styling | `tailwind-4` |
| Zod / RHF validation | `zod-4` |
| Create/edit global stores | `zustand-5` |
| E2E tests | `playwright` |

---

## Critical Rules - Non-negotiable

### Architecture
- UI never performs HTTP directly; API calls live only in `frontend/src/api/resources/`.
- Server state uses TanStack Query; UI state uses Zustand.
- Prefer Zod-derived types to avoid duplication.

### React
- Always use named imports from React.
- Do not use `useMemo` or `useCallback` (React Compiler handles it).

### Styling
- Use semantic tokens from Metro CDMX (no hardcoded colors).
- Never use `var()` inside `className`.

### Security
- JWT must stay in HttpOnly cookies (never localStorage/sessionStorage).
- Mutating requests must include `X-CSRF-TOKEN`.

---

## Decision Trees

### State Placement
```
Needs server cache/refetch? -> TanStack Query
UI-only state? -> Zustand
Local component state? -> useState
```

### Component Placement
```
Reusable across 2+ features? -> frontend/src/components/
Single feature only? -> frontend/src/features/<feature>/components/
Primitive UI? -> frontend/src/components/ui/
```

### API Call Placement
```
HTTP request? -> frontend/src/api/resources/
Transform/adapter? -> frontend/src/api/utils/
Types shared? -> frontend/src/api/types/
```

---

## Project Structure (Frontend)

```
frontend/src/
├── api/
│   ├── client.ts
│   ├── resources/
│   ├── types/
│   └── interceptors/
├── components/
│   ├── ui/
│   └── shared/
├── features/
├── providers/
├── routes/
├── store/
├── styles/
└── test/
```

---

## Commands

```bash
bun dev
bun build
bun lint
bun test
```

---

## QA Checklist

- [ ] UI states handled (loading, empty, error)
- [ ] API calls use `frontend/src/api/resources/`
- [ ] No hardcoded colors or `var()` in className
- [ ] Zustand/TanStack Query used appropriately
- [ ] Tests updated when contracts change
