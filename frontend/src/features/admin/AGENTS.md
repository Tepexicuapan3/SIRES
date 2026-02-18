# AGENTS.md - Admin Feature Ruleset

## Alcance

- Aplica a `frontend/src/features/admin/**`.
- Sigue el estilo de `frontend/src/features/auth/` para queries y mutations.

## Reglas

- No usar adapters: el backend entrega camelCase segun `docs/api/modules/rbac.md`.
- Queries y mutations separados por modulo y con keys dedicadas.
- UI no realiza HTTP directo; usa hooks que llaman `api/resources`.
- Reutilizable va en `shared/`; lo especifico en `modules/<modulo>/`.
- Catalogos: separar por catalogo en `modules/catalogos/<catalogo>/`.
- Cuando falte permiso para catalogos secundarios (roles/permisos, etc.), usar aviso contextual neutro (no banner rojo) y sin codigos tecnicos de permiso.
- Deshabilitar solo controles dependientes de ese catalogo y mantener visibles los datos ya cargados.
- Evitar requests innecesarios a endpoints sin permiso usando `enabled: false` en queries.
- Resolver permisos de acciones de escritura con `usePermissionDependencies()` para aplicar dependencias declaradas.
- Si un modulo requiere permiso compuesto (ej. editar + catalogos), modelarlo como dependencia en `permission-dependencies.ts` en lugar de checks ad-hoc por componente.
- Para botones/rutas que deban respetar dependencias completas, usar modo `dependencyAware` en `PermissionGate` o `ProtectedRoute`.

## Capability map (v1)

- Usuarios:
  - `admin.users.read` -> `admin:gestion:usuarios:read`
  - `admin.users.create` -> `admin:gestion:usuarios:create`
  - `admin.users.update` -> `admin:gestion:usuarios:update`
  - `admin.users.rolesCatalog.read` -> `admin:gestion:roles:read`
  - `admin.users.permissionsCatalog.read` -> `admin:gestion:permisos:read`
  - `admin.users.editFull` -> `usuarios:read + usuarios:update + roles:read + permisos:read`
- Roles:
  - `admin.roles.read` -> `admin:gestion:roles:read`
  - `admin.roles.create` -> `admin:gestion:roles:create`
  - `admin.roles.update` -> `admin:gestion:roles:update`
  - `admin.roles.delete` -> `admin:gestion:roles:delete`
  - `admin.roles.permissionsCatalog.read` -> `admin:gestion:permisos:read`
  - `admin.roles.editFull` -> `roles:read + roles:update + permisos:read`
- Catalogos:
  - `admin.catalogs.areas.*` -> `admin:catalogos:areas:*`
  - `admin.catalogs.centers.*` -> `admin:catalogos:centros_atencion:*`

## Checklist para nuevos modulos admin

1) Definir capability keys de dominio (no checks ad-hoc en componentes).
2) Agregar requirement en backend (`CAPABILITY_REQUIREMENTS`) y, si aplica, dependencias explicitas.
3) Consumir capability en pages/dialogs (`usePermissionDependencies`).
4) Proteger queries de catalogos con `enabled: false`.
5) Implementar estado UX de acceso faltante (aviso neutro + disable selectivo).
6) Cubrir con tests unit/integration de capability/dependency.

## Estructura por modulo

Cada submodulo repite esta base:

```txt
pages/
components/
queries/
mutations/
domain/
utils/
```

## Catalogos actuales

- `centros-atencion`
- `areas`
