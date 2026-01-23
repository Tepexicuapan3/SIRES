# AGENTS.md - SIRES Backend Presentation Ruleset

## How to Use This Guide

- Applies only to `backend/src/presentation/`.
- If it conflicts with `backend/AGENTS.md`, this guide wins.

## Skills Reference

- `django-drf` - DRF view/serializer patterns

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Design Django/DRF APIs | `django-drf` |

---

## Critical Rules - Non-negotiable

### Responsibilities
- Presentation maps HTTP to use cases only.
- No business rules in views/serializers.
- Use cases return `(result, error_code)`; presentation maps to HTTP.

### Serialization
- Separate read/create/update serializers when behavior differs.
- Keep serializers thin; no business logic.

### Responses
- Return consistent JSON shapes.
- Do not leak internal error details to clients.

---

## Decision Trees

### Serializer Selection
```
Read -> <Entity>Serializer
Create -> <Entity>CreateSerializer
Update -> <Entity>UpdateSerializer
```

### Error Mapping
```
Use case error_code -> map to HTTP status + message
No error_code -> 200/201 with result
```

---

## QA Checklist

- [ ] No business logic in presentation
- [ ] Serializer responsibilities are clear
- [ ] Error mapping is explicit and consistent
