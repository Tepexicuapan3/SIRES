# AGENTS.md - SIRES Frontend Ruleset

## Scope

- Applies only to changes inside `frontend/`.
- If it conflicts with the root `AGENTS.md`, this guide wins.

## Load Narrow Context

- `frontend/src/domains/AGENTS.md` - domain scaffolding and migration flow.
- `frontend/src/api/AGENTS.md` - API client/contracts.
- `frontend/src/components/AGENTS.md` - shared UI/component rules.
- `frontend/src/features/AGENTS.md` - feature-module patterns.
- `frontend/src/features/admin/AGENTS.md` - admin module specifics.
- `frontend/src/routes/AGENTS.md` - route/guard rules.
- `frontend/src/test/AGENTS.md` - test strategy and execution.

## Skills Reference

- `vercel-react-best-practices` - React performance and refactoring patterns
- `interface-design` - UI layout and visual hierarchy design before implementation
- `web-design-guidelines` - UI/UX and accessibility compliance reviews
- `typescript` - Strict TS types
- `tailwind-4` - Tailwind and `cn()`
- `zod-4` - Zod v4 validation
- `zustand-5` - UI state management
- `error-handling-patterns` - Error contracts and fallback behavior
- `systematic-debugging` - Root-cause-first debugging workflow
- `brainstorming` - Planning and scope definition before implementation
- `playwright` - E2E testing
- `find-skills` - Discover/install skills when requested

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Create/modify React components (performance-aware) | `vercel-react-best-practices` |
| Create new UI screens/layout direction before implementation | `interface-design` |
| Review UI/UX/accessibility compliance | `web-design-guidelines` |
| Write TypeScript types | `typescript` |
| Tailwind styling | `tailwind-4` |
| Zod / RHF validation | `zod-4` |
| Create/edit global stores | `zustand-5` |
| Design/review UI and API error states | `error-handling-patterns` |
| Debug bugs, test failures, and regressions | `systematic-debugging` |
| User asks for planning/discovery before coding | `brainstorming` |
| E2E tests | `playwright` |
| User asks to discover/install skills | `find-skills` |

---

## Critical Rules - Non-negotiable

### Architecture
- UI never performs HTTP directly; API calls live only in `frontend/src/api/resources/`.
- Server state uses TanStack Query; UI state uses Zustand.
- Prefer Zod-derived types to avoid duplication.

### React
- Always use named imports from React.
- React Compiler is enabled: avoid `useMemo`/`useCallback` by default; only use manual memoization with measured evidence.

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
Domain reusable building block? -> frontend/src/domains/<domain>/
Primitive UI? -> frontend/src/components/ui/
```

### API Call Placement
```
HTTP request? -> frontend/src/api/resources/
Transform/adapter? -> frontend/src/api/utils/
Types shared? -> frontend/src/api/types/
```

---

## Commands

```bash
bun dev
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
- [ ] If domain scaffolding changed, migration notes updated in `docs/guides/incremental-domain-migration.md`
