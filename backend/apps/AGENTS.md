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
- `uses_case/` - business use cases (domain orchestration).
- `repositories/` - ORM and data access details.
- `services/` - reusable technical services (token, csrf, otp, email, audit).

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
