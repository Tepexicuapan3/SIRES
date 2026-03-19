# Frontend Domains (Target Structure)

> TL;DR: `frontend/src/domains/` es el destino para modularizacion por dominio. `frontend/src/features/` sigue operando mientras la migracion sea incremental.

## Problem / Context

El frontend actual esta orientado a features. Para trabajo paralelo IA-first por ownership, se requiere estructura por dominio sin romper rutas activas.

## Solution / Implementation

- Mantener `features` como runtime principal durante Fase 1.
- Introducir `domains` para nuevos slices y extracciones controladas.
- Conectar con rutas existentes via adapters hasta completar cada dominio piloto.

### Scaffolding base creado en Fase 1

- `frontend/src/domains/auth-access/` (Auth & Access)
- `frontend/src/domains/recepcion/` (Recepcion)

Estos directorios son base de migracion incremental y no reemplazan rutas activas.

### Plantilla base por dominio

```text
frontend/src/domains/<domain>/
  components/   # presentational/container
  hooks/        # orchestration + query/mutation hooks
  pages/        # screens del dominio
  state/        # Zustand slices del dominio
  adapters/     # mapping con contracts existentes
  types/        # domain contracts
```

## References

- `docs/architecture/domain-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/guides/incremental-domain-migration.md`
