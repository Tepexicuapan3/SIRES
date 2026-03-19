# AGENTS.md - Backend Apps Implementation Guide

## Scope

- Applies to `backend/apps/**`.
- If it conflicts with `backend/AGENTS.md`, this file wins.

## Skills Reference

- `django-drf` - endpoint implementation details.
- `api-design-principles` - contract consistency.
- `error-handling-patterns` - error model and resilience.
- `systematic-debugging` - root-cause debugging workflow.
- `brainstorming` - plan before implementing complex changes.
- `pytest` - test coverage for backend behavior.
- `find-skills` - discover/install skills on demand.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Implement views/serializers/permissions/filters | `django-drf` |
| Design/review endpoint contracts | `api-design-principles` |
| Normalize error responses and retries/fallback | `error-handling-patterns` |
| Debug endpoint regressions and failing tests | `systematic-debugging` |
| Plan architecture/options before coding | `brainstorming` |
| Add/update backend tests | `pytest` |
| Discover/install additional skills | `find-skills` |

## Layered Architecture (Required)

- `views.py` - HTTP transport only (request/response orchestration).
- `serializers.py` - input/output validation and shaping.
- `use_cases/` or existing `uses_case/` - application/use-case orchestration.
- `repositories/` - ORM and data access details.
- `services/` - reusable technical services (token, csrf, otp, email, audit).

## Business Logic Placement (Mandatory)

- Critical business rules belong in `use_cases/` and domain modules, not in views or serializers.
- Views must delegate to use cases; serializers validate/map data only.
- Keep authorization/business permissions in dedicated policy functions/modules.
- Keep transaction boundaries at use-case level, not in view handlers.
- Hard ban: adding domain decisions inside generic helpers under `utils/`.

## Design Pattern Guidance

- Use Cases / Application Services: mandatory default for operation entrypoints.
- Repository Pattern: apply when query complexity, consistency guarantees, or multiple sources justify it.
- Domain Events (internal first): trigger internal events before introducing external integration events.
- Avoid over-abstraction: do not create repository/event layers without current domain pressure.

## Anti-pattern Bans

- Do not place pricing/permission/eligibility rules directly in DRF transport code.
- Do not create cross-domain direct SQL reads/writes.
- Do not introduce microservice boundaries from this subtree.
- Do not add full CQRS/event-sourcing patterns by default.

## Domain Data Ownership and Migration Guardrails (Explicit)

- Every table/schema/migration touched from `backend/apps/**` must have a single domain owner.
- Cross-domain direct DB access is prohibited (reads and writes); use API contracts, events, or read-models.
- Keep migration incremental: no big-bang move from `apps` to `domains`; coexistence is expected until each domain reaches DoD.

## Inter-domain Communication Rules

- Use only:
  - formal query/service contracts,
  - application-layer orchestrator use cases,
  - domain events with explicit subscribers.
- Do not depend on another domain's internal models/repositories/business rules.
- Do not implement uncontrolled cross-domain data reads/writes.

## Real-time, Audit, and Permissions

- Real-time is a controlled exception; keep request/response as default transport.
- If real-time is introduced in this subtree, keep handlers/adapters thin and delegate critical logic to use cases.
- Every critical operation must emit/record audit data with minimum fields (`actor`, `timestamp`, `action`, `domain`, `resource`, `result`, `contextId/requestId`).
- Include `ip`/`userAgent` when available and `beforeState`/`afterState` for mutations.
- Use atomic permissions and centralized policy/authorization modules; do not rely on role-string checks in views/serializers.

## Endpoint Workflow

1. Define serializer(s) in `serializers.py`.
2. Implement use case in `uses_case/`.
3. Add/adjust repository logic in `repositories/` if needed.
4. Implement view in `views.py`.
5. Wire routes in `urls.py` and include under `backend/config/urls.py`.
6. Add/adjust tests.

## API Contract Rules

- Use `api/v1/` prefix consistently.
- Keep route style consistent (no accidental trailing slash drift).
- Keep response keys in camelCase.
- Use standard error payload from `apps.authentication.services.response_service.error_response()`:
  - `code`, `message`, `status`, `timestamp`, optional `details`, optional `requestId`.
- If header `X-Request-ID` exists, propagate it as `requestId`.

## Auth and Security

- Protected endpoints must authenticate via cookie session flow.
- Mutating endpoints (`POST/PUT/PATCH/DELETE`) must validate CSRF using `X-CSRF-TOKEN`.
- Keep JWT transport in cookies (`access_token`, `refresh_token`) and avoid header-token shortcuts.

## Data and Naming

- Preserve existing DB naming conventions (`db_column`, spanish legacy names).
- Avoid creating new app/module folders with spaces.

## QA Checklist

- [ ] Serializer validates all required input.
- [ ] Use case contains business rules, not the view.
- [ ] Repository encapsulates query details.
- [ ] Error responses use standard shape.
- [ ] Auth and CSRF checks are present when required.
- [ ] URLs are wired under `api/v1/`.
- [ ] Tests cover success and failure paths.
- [ ] Inter-domain calls use contract/orchestrator/event mechanisms only.
- [ ] Real-time usage (if any) is justified and delegates to use cases.
- [ ] Critical operations include audit fields and append-only persistence expectations.
- [ ] Authorization checks use atomic permissions/policies, not ad-hoc roles.
