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

## QA Checklist

- [ ] Feature follows module boundaries.
- [ ] No direct HTTP in UI components.
- [ ] Query/mutation separation is clear.
- [ ] Permission states are handled without noisy UX.
- [ ] Dependency-aware permission checks are used where needed.
