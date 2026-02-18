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
