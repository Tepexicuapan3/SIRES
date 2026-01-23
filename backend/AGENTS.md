# AGENTS.md - SIRES Backend Ruleset

## How to Use This Guide

- Applies only to changes inside `backend/`.
- If it conflicts with the root `AGENTS.md`, this guide wins.

## Skills Reference

Use these skills for detailed patterns:

- `django-drf` - DRF patterns
- `pytest` - Python testing

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Design Django/DRF APIs | `django-drf` |
| Backend Python tests | `pytest` |

---

## Critical Rules - Non-negotiable

### Architecture
- Django/DRF is the official backend for all new functionality.
- Clean Architecture layers are mandatory:
  - presentation: DRF views/serializers
  - use_cases: orchestration
  - infrastructure: DB, mail, cache
  - domain: entities and rules
- Use cases return `(result, error_code)` to decouple from HTTP.
- Repositories contain no business logic.
- Presentation only maps errors to HTTP.

### Security
- JWT stored in HttpOnly cookies only.
- CSRF via `X-CSRF-TOKEN` header.
- Parameterized queries only; never build SQL with string concatenation.
- Always validate server-side.

---

## Decision Trees

### Where Logic Belongs
```
HTTP mapping? -> presentation (DRF view/serializer)
Business rules? -> use_cases
Data access? -> infrastructure repositories
Entities/invariants? -> domain
```

### Use Case Error Handling
```
Success -> return (result, None)
Known failure -> return (None, ERROR_CODE)
Unexpected -> return (None, "SERVER_ERROR")
```

---

## Project Structure (Backend)

```
backend/src/
├── presentation/
│   └── api/
├── use_cases/
├── infrastructure/
├── domain/
└── tests/
```

---

## Commands

```bash
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
```

---

## QA Checklist

- [ ] Use case returns `(result, error_code)`
- [ ] No business logic in DRF views/serializers
- [ ] Parameterized queries only
- [ ] JWT/CSRF flow preserved
- [ ] Tests cover success and error cases
