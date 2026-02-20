# AGENTS.md - Frontend Testing Guide

## Scope

- Applies to `frontend/src/test/**`.
- If it conflicts with `frontend/AGENTS.md`, this file wins.

## Skills Reference

- `playwright` - E2E strategy and browser workflows.
- `systematic-debugging` - root-cause-first debugging for flaky/failing tests.
- `typescript` - typed test utilities and fixtures.
- `error-handling-patterns` - assert error and fallback behavior.
- `brainstorming` - plan broader testing strategy before coding.
- `find-skills` - discover/install skills when requested.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Create/maintain E2E tests | `playwright` |
| Debug failing or flaky tests | `systematic-debugging` |
| Write typed fixtures/utilities | `typescript` |
| Validate UI/API error behavior in tests | `error-handling-patterns` |
| User asks for planning/discovery before coding | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

## Testing Rules

- Keep tests deterministic and isolated.
- Prefer condition-based waiting over fixed sleeps/timeouts.
- Cover loading, empty, success, and error states.
- Reuse factories/mocks from `frontend/src/test/factories` and `frontend/src/test/mocks`.
- Keep MSW handlers aligned with current API contracts.

## Commands

```bash
bun test
```
