# Repo Navigation Map

> TL;DR: Mapa rapido para ubicar donde implementar cada tipo de cambio sin romper el runtime actual.

## Problem / Context

Con refactor activo, hay rutas legacy y rutas target. Sin mapa, el equipo pierde tiempo y mete cambios en lugares incorrectos.

## Solution / Implementation

## Vista de alto nivel

```text
SISEM/
  backend/
    apps/              # runtime actual
    domains/           # target incremental por dominio
    infrastructure/    # integraciones transversales
    tests/
  frontend/
    src/
      features/        # runtime actual
      domains/         # target incremental por dominio
      api/             # contratos HTTP y cliente
      routes/          # routing y guards
      components/      # UI compartida
  docs/
    architecture/      # mapas y reglas
    guides/            # operacion y playbooks
    templates/         # RFC/ADR/templates
```

## Donde tocar segun tipo de tarea

- Nueva API o logica backend: `backend/apps/` (runtime) y/o `backend/domains/` (target incremental).
- Nueva UI de feature activa: `frontend/src/features/`.
- Extraccion a modelo por dominio: `frontend/src/domains/`.
- Contratos HTTP: `frontend/src/api/` + `docs/api/`.
- Governance operativo: `docs/guides/` y `docs/architecture/`.

## Convenciones de transicion old -> new

- `backend/apps/` y `frontend/src/features/` se mantienen como runtime operativo.
- `backend/domains/` y `frontend/src/domains/` reciben scaffolding incremental por slices.
- Cada extraccion debe dejar un adapter o wrapper temporal documentado para no romper rutas actuales.
- Registrar estado del dominio (`legacy`/`hybrid`/`domain-first`) en `docs/guides/incremental-domain-migration.md`.
- Si una tarea toca runtime + target en el mismo PR, explicitar el puente de compatibilidad en la descripcion.

## References

- `docs/architecture/domain-map.md`
- `docs/guides/incremental-domain-migration.md`
