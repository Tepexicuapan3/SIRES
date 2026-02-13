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

## Patron para paginas de listado

- `shared/components/AdminPageIntro.tsx` unifica encabezados de modulo (titulo, descripcion e icono).
- `shared/components/ConfirmDestructiveDialog.tsx` evita duplicacion en confirmaciones de borrado.
- Cada modulo define sus columnas en componentes dedicados (`UsersTableColumns`, `RolesTableColumns`, `AreasTableColumns`) para mantener las pages delgadas y con una sola responsabilidad.
- Logica densa (busqueda/ranking de permisos) debe vivir en `utils/` (`users.permissions-search.ts`) y no dentro de componentes de UI.
- Guardado incremental y transformaciones de borrador en dialogs se extraen a `utils/` (`users.details-save.ts`, `roles.details-save.ts`, `users.details-draft.ts`, `roles.details-draft.ts`).
- Dialogos complejos se componen por bloques chicos (`UserCreateSidePanel`, `UserCreatedCredentialsCard`) para aislar layout de negocio.

## Patron base para catalogos CRUD

- Reutilizar componentes de `modules/catalogos/shared/components/`:
  - `CatalogModuleLayout`
  - `CatalogDialogHeader`
  - `CatalogStatusBadge`
  - `CatalogDetailsFooter`
  - `CatalogCreateResultCard`
- Reutilizar utilitarios de `modules/catalogos/shared/utils/`:
  - `catalog-feedback.ts` para errores de API normalizados
  - `catalog-format.ts` para fechas/hora de auditoria
- Casos de referencia implementados:
  - `catalogos/areas`
  - `catalogos/centros-atencion`

## Patron reutilizable para detalles CRUD

### Base compartida

- `shared/components/details/AdminDetailsDialogShell.tsx` centraliza layout, confirmacion por cambios sin guardar, loading/error y footer configurable.
- `shared/components/details/AdminDetailsHeader.tsx` y `AdminDetailsFooter.tsx` evitan duplicar estructura visual en cada modulo.
- `shared/types/details-dialog.types.ts` define el contrato de secciones para tabs dinamicas.

### Caso con tabs (RBAC)

- Construir `sections` con mas de un bloque (`general`, `roles`, `permissions`, etc.).
- Cada bloque mantiene su propia UI y hooks de mutation/query.

### Caso sin tabs (catalogos solo formulario)

- Definir `sections` con **una sola** seccion (`general`).
- El shell detecta `sections.length === 1` y renderiza contenido directo, sin `TabsList`.
- Reusar el mismo footer para guardar/cancelar y confirmacion de salida.

### Checklist para agregar un nuevo catalogo

1. Crear queries/mutations y keys del catalogo (`modules/catalogos/<catalogo>/queries|mutations`).
2. Implementar `DetailsDialog` del catalogo usando `AdminDetailsDialogShell` con una sola seccion.
3. Conectar accion `Ver detalles` desde la tabla (`TableToolbar` o `onRowClick`).
4. Cubrir test de UI: abrir detalle, editar, guardar, confirmar salida con cambios.
