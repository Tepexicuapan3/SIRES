# AGENTS.md - SIRES Frontend API Ruleset

## How to Use This Guide

- Applies only to `frontend/src/api/`.
- If it conflicts with `frontend/AGENTS.md`, this guide wins.
- For system-wide rules, see the root `AGENTS.md`.

## Skills Reference

- `typescript` - Types and interfaces
- `zod-4` - Zod validation
- `api-design-principles` - API contract review (resources, methods, status codes, versioning)
- `error-handling-patterns` - Standardized error shape, retries, and fallback behavior
- `systematic-debugging` - Root-cause-first debugging for integration and contract issues
- `brainstorming` - planning integration strategy before implementation
- `tailwind-4` - Only if UI tokens are referenced in errors
- `find-skills` - Discover/install skills when requested

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Write TypeScript types | `typescript` |
| Zod validation | `zod-4` |
| Review API contracts consumed by frontend | `api-design-principles` |
| Design/review API error normalization and fallback behavior | `error-handling-patterns` |
| Debug API integration issues and regressions | `systematic-debugging` |
| User asks for planning/discovery before coding | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

---

## Critical Rules - Non-negotiable

### API Boundary
- HTTP calls live only in `resources/`.
- Shared Axios config lives in `client.ts` and `interceptors/`.
- API errors must be normalized via `api/utils/errors.ts`.

### Types
- API types live in `types/`.
- Use Zod schemas as the single source of truth when possible.
- Avoid duplicate type definitions.

### Error Handling
- Always return normalized error shapes from resources.
- Do not throw raw Axios errors from feature code.

### Inter-domain, Real-time, and Permissions
- Cross-domain frontend integration must happen through explicit API contracts, not internal domain imports.
- Real-time integrations are exceptions and must live in dedicated adapters/contracts.
- Do not place critical business/security decisions in WebSocket consumers or API interceptors.
- Authorization logic in this layer is contract mapping only; backend remains source of truth.
- Never encode security as ad-hoc role-string checks in client transport logic.

### Part 3 Hooks
- Keep DB strategy wording aligned in this layer: backend runs with one operational PostgreSQL source now and strict domain ownership/logical isolation; physical separation may happen later by criteria.
- Do not model API clients assuming cross-domain DB shortcuts; require explicit backend contract aggregation.
- For critical resources, document/reflect idempotency, concurrency, and transaction expectations exposed by backend contracts.
- When API contracts change boundaries or critical behavior, update related docs/DoD references in the same PR.
- Prioritize risk-based tests for auth/authz transport paths, audit correlation metadata propagation, and concurrency-sensitive mutations.

---

## Decision Trees

### Where to Put Code
```
HTTP request -> resources/
Shared types -> types/
Adapters/transforms -> utils/
Request/response config -> interceptors/
```

### Validation Strategy
```
Client form validation -> Zod schema
API response validation -> Zod schema if contract is critical
```

---

## Project Structure (API)

```
frontend/src/api/
├── client.ts
├── resources/
├── types/
├── interceptors/
└── utils/
```

---

## QA Checklist

- [ ] API calls live only in `resources/`
- [ ] Types are centralized in `types/`
- [ ] Errors are normalized
- [ ] Zod schemas match API contract
- [ ] Cross-domain API usage is contract-driven and explicit.
- [ ] Realtime flows (if any) are isolated and documented.
- [ ] Permissions represented as atomic capabilities, not role-string assumptions.
- [ ] Critical API paths have proportional test coverage by risk.
- [ ] Contract/boundary changes updated docs in the same PR.
