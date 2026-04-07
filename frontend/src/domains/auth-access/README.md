# Frontend Domain Scaffold: auth-access

Base del dominio Auth & Access en frontend domain-first.

Estado actual: `domain-first` (post Lote 5 cleanup final).

- Núcleo migrado a `domains/auth-access`: hooks de sesión/permisos/capabilities, adaptadores de caché/sync/eventos y tipos de autorización.
- Lote 2 (auth UI) migrado a `domains/auth-access`: `pages/LoginPage`, `pages/OnboardingPage` y `components/{login,recovery,onboarding,shared}`.
- Lote 3 (RBAC core + remanentes auth) migrado a `domains/auth-access`:
  - `components/shared/ParticlesBackground.tsx`
  - `pages/admin/users/UsersPage.tsx`
  - `pages/admin/roles/RolesPage.tsx`
- Lote 4 (RBAC restante movible) migrado a `domains/auth-access`:
  - `components/admin/rbac/{users,roles,shared}`
  - `hooks/rbac/{users,roles,permissions}` (queries + mutations + keys)
  - `adapters/rbac/{users,roles,shared}`
  - `types/rbac/{users.schemas,roles.schemas}`


## Remanentes legacy (post Lote 5)

- No quedan wrappers `@deprecated` activos en `frontend/src/features/auth/**` ni en `frontend/src/features/admin/modules/rbac/**`.
- La implementación auth/rbac vive en `frontend/src/domains/auth-access/**`.

## Estructura

- `components/`
- `hooks/`
- `pages/`
- `state/`
- `adapters/`
- `types/`

## Guardrail

No mover rutas activas sin evidencia de regresión. Mantener migración incremental por lotes con validación focal Docker-first para evitar regresiones.
