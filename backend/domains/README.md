# Backend Domains (Target Structure)

> TL;DR: `backend/domains/` es la estructura objetivo para migracion incremental por dominios. `backend/apps/` sigue siendo runtime activo hasta cerrar cada dominio piloto.

## Problem / Context

El backend actual funciona desde `backend/apps/`, pero el equipo necesita trabajar por dominios completos sin choques entre frentes.

## Solution / Implementation

- Este directorio define la estructura destino por dominio.
- La migracion es `old -> new` por slices, sin big-bang.
- Se permiten wrappers/adapters temporales para convivir con `apps`.

### Scaffolding base creado en Fase 1

- `backend/domains/auth_access/` (Auth & Access)
- `backend/domains/recepcion/` (Recepcion)

Estos directorios son solo base estructural y no reemplazan runtime actual.

### Plantilla base por dominio

```text
backend/domains/<domain>/
  presentation/     # DRF views/serializers/permissions
  use_cases/        # application services
  infrastructure/   # repositories/integrations
  domain/           # entities/value objects/domain services
  tests/            # tests del dominio
```

## References

- `docs/architecture/domain-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/guides/incremental-domain-migration.md`
