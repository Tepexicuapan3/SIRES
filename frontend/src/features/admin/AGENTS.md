# AGENTS.md - Admin Feature Ruleset

## Scope

- Aplica a `frontend/src/features/admin/**`.
- Si hay conflicto con `frontend/src/features/AGENTS.md`, este archivo manda.
- Mantener paridad estructural con `frontend/src/features/auth/` para queries/mutations.

## Skills Reference

- `vercel-react-best-practices` - rendimiento y refactor de componentes admin.
- `interface-design` - diseno de layouts/flujos admin antes de implementar.
- `web-design-guidelines` - auditoria UX/accesibilidad.
- `typescript` - tipado estricto de contratos y UI.
- `zod-4` - validaciones de formularios/contratos.
- `error-handling-patterns` - estados de error y fallback consistentes.
- `systematic-debugging` - depuracion por causa raiz.
- `brainstorming` - planificacion antes de features grandes.
- `find-skills` - descubrir/instalar skills cuando se pida.

## Auto-invoke Skills

| Accion | Skill |
| --- | --- |
| Crear/refactor componentes admin | `vercel-react-best-practices` |
| Definir layout/flujo admin antes de codear | `interface-design` |
| Revisar UX/accesibilidad admin | `web-design-guidelines` |
| Definir tipos/contratos | `typescript` |
| Implementar validaciones | `zod-4` |
| Definir manejo de errores/fallback | `error-handling-patterns` |
| Debuggear regresiones admin | `systematic-debugging` |
| Usuario pide planificar antes de implementar | `brainstorming` |
| Usuario pide descubrir/instalar skills | `find-skills` |

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
