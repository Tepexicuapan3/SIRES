# AGENTS.md - Backend Testing Guide

## Scope

- Applies to `backend/tests/**`.
- If it conflicts with `backend/AGENTS.md`, this file wins.

## Skills Reference

- `pytest` - backend testing patterns and structure.
- `systematic-debugging` - failing test investigation by root cause.
- `error-handling-patterns` - validating API/domain error behavior.
- `brainstorming` - planning test strategy before broad changes.
- `find-skills` - discover/install skills when requested.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Write/refactor backend tests | `pytest` |
| Diagnose flaky/failing tests | `systematic-debugging` |
| Validate error contracts in tests | `error-handling-patterns` |
| Plan test strategy before large refactors | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

## Test Rules

- Prefer deterministic tests: no arbitrary sleeps, no hidden ordering assumptions.
- Cover both happy path and failure path for each endpoint/use case touched.
- Assert standard error payload shape (`code`, `message`, `status`, optional `details`, optional `requestId`).
- Keep fixtures/data builders explicit and local to the suite when possible.
- Avoid coupling tests to implementation details that can change without contract impact.

## Execution

```bash
python manage.py test
```
