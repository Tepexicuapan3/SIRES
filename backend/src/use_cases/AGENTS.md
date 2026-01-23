# AGENTS.md - SIRES Use Cases Ruleset

## How to Use This Guide

- Applies only to `backend/src/use_cases/`.
- If it conflicts with `backend/AGENTS.md`, this guide wins.

## Skills Reference

- `django-drf` - API integration patterns
- `pytest` - Use case testing

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Design Django/DRF APIs | `django-drf` |
| Backend Python tests | `pytest` |

---

## Critical Rules - Non-negotiable

### Responsibilities
- Use cases orchestrate business rules and repository calls.
- No HTTP concerns in use cases.
- Return `(result, error_code)`.

### Error Codes
- Use explicit, stable error codes (e.g., `USER_NOT_FOUND`).
- Do not return HTTP status codes from use cases.

### Repositories
- Use repository interfaces only.
- No direct ORM or raw SQL inside use cases.

---

## Decision Trees

### Result Shape
```
Success -> (result, None)
Known failure -> (None, ERROR_CODE)
Unexpected -> (None, "SERVER_ERROR")
```

---

## QA Checklist

- [ ] No HTTP logic in use case
- [ ] Repository used for data access
- [ ] Error codes are explicit and stable
- [ ] Tests cover success and error branches
