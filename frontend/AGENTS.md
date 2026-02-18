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

### Permission UX States
- If a secondary catalog is unavailable due missing permissions, show a neutral contextual notice (not a critical/red error banner).
- Keep notice copy minimal and user-facing; do not expose raw permission codes in UI text.
- Disable only the controls that depend on that catalog; keep read-only data visible when possible.
- Avoid unnecessary requests to unauthorized endpoints by using query `enabled: false` when permission checks fail.

### Permission Dependency Model
- Permission dependencies are declared in `frontend/src/features/auth/domain/permission-dependencies.ts`.
- For mutating permissions, use dependency-aware checks via `usePermissionDependencies()`.
- If a new permission is introduced, update dependency rules and add/update unit tests in `frontend/src/test/unit/auth/permission-dependencies.test.ts`.
- Use `dependencyAware` mode in guards/gates when the UX must enforce full capability (not only raw permission presence).

### Capability-first Authorization (required for admin)
- Prefer `hasCapability("...")` for action gating in pages/dialogs and for route guards.
- Use `hasPermission("...")` only for basic visibility where dependency closure is not required.
- Backend projection is the primary source (`capabilities`, `effectivePermissions`, `permissionDependenciesVersion`).
- `usePermissionDependencies()` must keep fallback behavior when backend projection is missing:
  - evaluate local dependency rules;
  - never crash on partial mocks (`capabilities` can be undefined in tests).
- Query policy for protected catalogs:
  - pass `enabled: false` when the required read capability is not granted.
- UX policy when catalog permission is missing:
  - show neutral contextual notice;
  - keep existing assigned data visible if available;
  - disable only dependent controls.

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
