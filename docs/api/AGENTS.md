# AGENTS.md - API Docs Contract Guide

## Scope

- Applies to `docs/api/**`.
- If it conflicts with `docs/AGENTS.md`, this file wins.

## Skills Reference

- `api-design-principles` - REST resource design, versioning, and consistency.
- `error-handling-patterns` - error payload standards, retries, fallback notes.
- `brainstorming` - planning API documentation structure before writing.
- `find-skills` - discover/install skills when requested.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Define/review endpoint contracts | `api-design-principles` |
| Define/review error schema documentation | `error-handling-patterns` |
| User asks for planning/discovery before documentation | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

## API Docs Rules

- Keep endpoint definitions aligned with backend implementation under `backend/apps/**`.
- Document method, path, auth requirements, request schema, response schema, and status codes.
- Document CSRF requirement for mutating requests (`X-CSRF-TOKEN`).
- Keep error payload shape consistent (`code`, `message`, `status`, optional `details`, optional `requestId`).
- Prefer concrete request/response examples over generic prose.

## QA Checklist

- [ ] Contract matches current backend behavior.
- [ ] Status codes and error shapes are explicit.
- [ ] Auth/CSRF requirements are explicit.
- [ ] Example payloads are copy/paste ready.
