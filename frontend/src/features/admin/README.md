# Admin Feature

> TL;DR: Modulo administrativo modular y escalable, organizado por submodulos con queries/mutations al estilo `features/auth`.

## Objetivo

Separar Admin en modulos independientes (RBAC, catalogos, reportes, etc.) con estructura repetible para crecer sin ruido.

## Convenciones

- Contratos vienen en camelCase desde backend (sin adapters).
- Queries y mutations viven separados, con keys dedicadas por modulo.
- UI solo consume hooks; HTTP vive en `frontend/src/api/resources`.
- Reutilizable va en `shared/`, lo especifico va en `modules/<modulo>/`.

## Estructura base

```txt
admin/
├── shared/
│   ├── components/   # tablas, filtros, paginado, estados
│   ├── hooks/        # helpers genericos (filtros, search, pagination)
│   └── utils/
└── modules/
    ├── rbac/
    │   ├── users/
    │   ├── roles/
    │   ├── permissions/
    │   ├── overrides/
    │   └── shared/
    ├── catalogos/
    │   ├── shared/
    │   ├── centros-atencion/
    │   └── areas/
    ├── expedientes/
    ├── reportes/
    ├── analiticas/
    ├── estadisticas/
    ├── autorizaciones/
    └── licencias/
```

## Flujo de datos

UI (components/pages) → queries/mutations → `api/resources` → backend.
