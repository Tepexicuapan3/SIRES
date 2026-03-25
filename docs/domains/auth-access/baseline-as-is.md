# auth-access - Baseline tecnico AS-IS (KAN-47)

> TL;DR: baseline versionado del estado actual (AS-IS) del dominio `auth-access` para desbloquear KAN-48+, sin cambios de runtime.

## 1) Alcance del baseline y fecha de corte

- **Ticket**: KAN-47 - Baseline tecnico versionado AS-IS de `auth_access`.
- **Fecha de corte**: 2026-03-23.
- **Cobertura**: backend auth/rbac/catalogos vinculados a acceso, frontend auth/rbac (rutas/guards/API client), snapshot de datos, controles de seguridad/trazabilidad, contratos criticos y deuda priorizada.
- **Fuera de alcance**: implementacion/refactor runtime, cambios funcionales, builds, migraciones nuevas.
- **Fuente canonica de este baseline**: este documento + referencias a codigo/docs enlazadas abajo.

## 2) Inventario backend auth/rbac (rutas, modulos, responsabilidad)

### 2.1 Superficie de rutas backend

- Enrutador raiz API: `backend/config/urls.py`
  - `api/v1/` incluye `apps.authentication.urls`, `apps.administracion.urls`, `apps.catalogos.urls`.

### 2.2 Modulos clave AS-IS

| Modulo backend | Responsabilidad AS-IS | Evidencia |
| --- | --- | --- |
| `apps.authentication` | Auth session lifecycle (login/logout/me/verify/refresh), onboarding y recuperacion de acceso. | `backend/apps/authentication/urls.py`, `backend/apps/authentication/views.py` |
| `apps.authentication.services.*` | Cookies JWT HttpOnly, validacion CSRF, autenticacion por cookie, shape de error estandar. | `backend/apps/authentication/services/token_service.py`, `csrf_service.py`, `session_service.py`, `response_service.py` |
| `apps.authentication.repositories.user_repository` | Resolucion de usuario auth y proyeccion de permisos para sesion. | `backend/apps/authentication/repositories/user_repository.py` |
| `apps.administracion` (RBAC) | CRUD de roles, permisos, usuarios, asignaciones y overrides + auditoria RBAC. | `backend/apps/administracion/urls.py`, `backend/apps/administracion/views/rbac_views.py` |
| `apps.administracion.models.AuditoriaEvento` | Persistencia append-only de trazabilidad operativa para auth/rbac. | `backend/apps/administracion/models/auditoria_evento.py` |
| `apps.catalogos` (subset auth/rbac) | Catalogos `cat_roles`, `cat_permisos`, `cat_centros_atencion` consumidos por RBAC. | `backend/apps/catalogos/models/roles.py`, `permisos.py`, `backend/apps/catalogos/migrations/0001_initial.py` |
| `middlewares.auth.JWTAuthenticationMiddleware` | Publica `X-Auth-Revision` en responses autenticadas para sincronizacion FE. | `backend/middlewares/auth.py`, `backend/config/settings.py` |

### 2.3 Endpoints criticos auth/rbac (resumen)

- **Auth**: `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/verify`, `/auth/refresh`, `/auth/request-reset-code`, `/auth/verify-reset-code`, `/auth/reset-password`, `/auth/complete-onboarding`.
  - Fuente: `backend/apps/authentication/urls.py`.
- **RBAC core**: `/roles`, `/roles/:id`, `/permissions`, `/permissions/assign`, `/permissions/roles/:roleId/permissions/:permissionId`, `/users`, `/users/:id`, `/users/:id/activate`, `/users/:id/deactivate`, `/users/:id/roles`, `/users/:id/roles/primary`, `/users/:id/roles/:roleId`, `/users/:id/overrides`, `/users/:id/overrides/:code`.
  - Fuente: `backend/apps/administracion/urls.py`.

## 3) Inventario frontend auth/rbac (features, routes, guards, API client)

### 3.1 Guards y rutas

| Componente | Rol AS-IS | Evidencia |
| --- | --- | --- |
| `ProtectedRoute` | Gate de auth + permisos + onboarding obligatorio. | `frontend/src/routes/ProtectedRoute.tsx` |
| `GuestRoute` | Redireccion de usuarios autenticados a landing route o onboarding. | `frontend/src/routes/GuestRoute.tsx` |
| Router principal | Define rutas `/login`, `/onboarding`, `/dashboard`, `/admin/*` bajo guards. | `frontend/src/routes/Routes.tsx` |
| Rutas admin/rbac | Mapea permisos atomicos por subruta (`usuarios`, `roles`, `catalogos`, etc.). | `frontend/src/routes/modules/admin.routes.config.tsx` |

### 3.2 Features auth/rbac

| Area FE | Responsabilidad AS-IS | Evidencia |
| --- | --- | --- |
| `features/auth/pages/*` | UX de login, onboarding, recovery/reset password. | `frontend/src/features/auth/pages/LoginPage.tsx`, `OnboardingPage.tsx` |
| `features/auth/queries/*` | Sesion (`/auth/me`) como source of truth y evaluacion de permisos/capabilities. | `frontend/src/features/auth/queries/useAuthSession.ts`, `usePermissions.ts`, `usePermissionDependencies.ts` |
| `features/auth/mutations/*` | Login/logout/refresh centralizados. | `frontend/src/features/auth/mutations/useLogin.ts`, `useLogout.ts`, `useRefreshSession.ts` |
| `features/admin/modules/rbac/*` | UI de gestion de usuarios/roles/permisos conectada a recursos API. | `frontend/src/routes/modules/admin.routes.config.tsx`, `frontend/src/features/admin/modules/rbac/**` |

### 3.3 API client FE para auth/rbac

| Recurso FE | Endpoints consumidos |
| --- | --- |
| `authAPI` | `/auth/*` (login, me, logout, verify, refresh, onboarding, reset) |
| `rolesAPI` | `/roles*`, `/permissions/assign`, `/permissions/roles/:roleId/permissions/:permissionId` |
| `usersAPI` | `/users*`, `/users/:id/roles*`, `/users/:id/overrides*` |
| `permissionsAPI` | `/permissions` |

Evidencia: `frontend/src/api/resources/auth.api.ts`, `roles.api.ts`, `users.api.ts`, `permissions.api.ts`.

## 4) Snapshot DB/modelos/migraciones relevantes y ownership

### 4.1 Tablas auth/rbac/catalogos en uso

| Tabla | Rol en auth_access AS-IS | Modelo/Migracion fuente |
| --- | --- | --- |
| `sy_usuarios` | Identidad, estado de cuenta, flags de onboarding. | `backend/apps/authentication/models.py`, `backend/apps/authentication/migrations/0001_initial.py` |
| `det_usuarios` | Perfil de usuario y relacion a centro de atencion. | `backend/apps/authentication/models.py`, `backend/apps/authentication/migrations/0002_det_usuario.py` |
| `cat_roles` | Catalogo de roles y metadatos (`is_admin`, `landing_route`). | `backend/apps/catalogos/models/roles.py`, `backend/apps/catalogos/migrations/0001_initial.py` |
| `cat_permisos` | Catalogo atomico de permisos. | `backend/apps/catalogos/models/permisos.py`, `backend/apps/catalogos/migrations/0001_initial.py` |
| `rel_usuario_roles` | Asignacion rol-usuario con `is_primary` y baja logica. | `backend/apps/administracion/models/usuario_rol.py`, `backend/apps/administracion/migrations/0001_initial.py` |
| `rel_rol_permisos` | Relacion rol-permiso (baja logica). | `backend/apps/administracion/models/rol_permiso.py`, `backend/apps/administracion/migrations/0001_initial.py` |
| `rel_usuario_overrides` | Overrides ALLOW/DENY por usuario-permiso. | `backend/apps/administracion/models/usuario_override.py`, `backend/apps/administracion/migrations/0001_initial.py` |
| `auditoria_eventos` | Trazabilidad de operaciones auth/rbac. | `backend/apps/administracion/models/auditoria_evento.py`, `backend/apps/administracion/migrations/0001_initial.py` |
| `cat_centros_atencion` | Catalogo referenciado por detalle de usuario (`id_centro_atencion`). | `backend/apps/catalogos/migrations/0001_initial.py` |

### 4.2 Notas de ownership (AS-IS)

- **Runtime actual**: ownership funcional de `auth_access` queda distribuido en `authentication` + `administracion` + `catalogos` (estado `legacy`).
- **Politica objetivo**: ownership por dominio con aislamiento logico en PostgreSQL compartido (sin acceso SQL cross-domain), evolucionando a fisico por criterio.
  - Referencia: `docs/architecture/db-ownership-migration-policy.md`.
- **Engine operativo**: PostgreSQL (tests usan SQLite in-memory como excepcion tecnica de ejecucion).
  - Evidencia: `backend/config/settings.py`.

## 5) Controles de seguridad y trazabilidad actuales

| Control | Estado AS-IS | Evidencia |
| --- | --- | --- |
| JWT en cookies HttpOnly | Implementado (`access_token_cookie`, `refresh_token_cookie`, `reset_token`). | `backend/apps/authentication/services/token_service.py` |
| CSRF por header `X-CSRF-TOKEN` | Implementado para mutaciones via validacion manual cookie/header. | `backend/apps/authentication/services/csrf_service.py`, `backend/apps/authentication/views.py`, `backend/apps/administracion/views/rbac_views.py` |
| Request correlation (`X-Request-ID`) FE | FE genera y envia request id en cada request. | `frontend/src/api/interceptors/request.interceptor.ts`, `frontend/src/api/utils/request-id.ts` |
| RequestId en error payload | Backend incluye `requestId` cuando llega header. | `backend/apps/authentication/services/response_service.py` |
| Revision de sesion | Backend publica `X-Auth-Revision` para sync FE. | `backend/middlewares/auth.py`, `backend/config/settings.py` |
| Auditoria auth | Eventos de login/sesion/reset/onboarding en flujo auth. | `backend/apps/authentication/views.py`, `backend/apps/authentication/services/audit_service.py` |
| Auditoria RBAC | Eventos por endpoint RBAC con before/after y actor/target. | `backend/apps/administracion/views/rbac_views.py`, `backend/apps/administracion/models/auditoria_evento.py` |

## 6) Mapa de contratos/endpoints criticos y consumo FE

| Endpoint | Backend handler | Consumo FE | Permiso/Acceso |
| --- | --- | --- | --- |
| `POST /auth/login` | `LoginView` | `authAPI.login` + `useLogin` | Publico |
| `GET /auth/me` | `MeView` | `authAPI.getCurrentUser` + `useAuthSession` | Sesion cookie |
| `POST /auth/logout` | `LogoutView` | `authAPI.logout` + `useLogout` | Sesion + CSRF |
| `POST /auth/refresh` | `RefreshView` | Interceptor error + `authAPI.refreshToken` | Refresh cookie + CSRF |
| `POST /auth/complete-onboarding` | `CompleteOnboardingView` | `authAPI.completeOnboarding` | Sesion + CSRF |
| `POST /auth/reset-password` | `ResetPasswordView` | `authAPI.resetPassword` | Reset cookie + CSRF |
| `GET /roles` | `RolesListCreateView.get` | `rolesAPI.getAll` | `admin:gestion:roles:read` |
| `POST /roles` | `RolesListCreateView.post` | `rolesAPI.create` | `admin:gestion:roles:create` + CSRF |
| `POST /permissions/assign` | `AssignRolePermissionsView.post` | `rolesAPI.permissions.assign` | `admin:gestion:roles:update` + CSRF |
| `GET /users` | `UsersListCreateView.get` | `usersAPI.getAll` | `admin:gestion:usuarios:read` |
| `POST /users` | `UsersListCreateView.post` | `usersAPI.create` | `admin:gestion:usuarios:create` + CSRF |
| `PATCH /users/:id` | `UserDetailView.patch` | `usersAPI.update` | `admin:gestion:usuarios:update` + CSRF |

Referencias de contrato detallado:

- `docs/api/modules/auth.md`
- `docs/api/modules/rbac.md`
- `docs/api/modules/catalogos.md`

## 7) Acoplamientos, riesgos y deuda (priorizados)

| Prioridad | Riesgo / deuda | Evidencia | Impacto |
| --- | --- | --- | --- |
| **P1** | Dominio `auth_access` fragmentado en 3 apps runtime (`authentication`, `administracion`, `catalogos`) sin capa dominio unificada. | `backend/config/urls.py`, `backend/apps/*` | Alta friccion para KAN-48+ (ownership difuso, cambios transversales costosos). |
| **P1** | `RequestIDMiddleware` existe pero no esta registrado en `MIDDLEWARE`; la trazabilidad depende del header cliente. | `backend/apps/administracion/middleware/request_id.py`, `backend/config/settings.py` | Riesgo de huecos de correlacion si clientes externos no envian `X-Request-ID`. |
| **P1** | Modelos RBAC/catalogos con `managed = False` mientras migraciones siguen siendo fuente de esquema. | `backend/apps/administracion/models/*.py`, `backend/apps/catalogos/models/*.py`, migraciones `0001_initial.py` | Riesgo de drift entre ORM, migraciones y DB real. |
| **P2** | Compat dual `fullname` vs `fullName` mantiene deuda de contrato FE/BE. | `docs/api/modules/rbac.md`, `frontend/src/api/types/users.types.ts` | Complejidad extra en tipado, sort/filter y evolucion de contrato. |
| **P2** | `apps.administracion.urls` mezcla RBAC con endpoints de expediente en el mismo modulo. | `backend/apps/administracion/urls.py` | Limites de dominio menos claros, mayor coupling accidental. |
| **P3** | Validacion CSRF manual en views con `csrf_exempt` como estrategia de borde. | `backend/apps/authentication/views.py`, `backend/apps/administracion/views/rbac_views.py` | Mantenibilidad/riesgo operativo si nuevas mutaciones olvidan validacion manual. |

## 8) Mapeo explicito AC KAN-47 -> evidencia

> Nota: se usa matriz AC documental de KAN-47 basada en el alcance requerido del ticket.

| AC KAN-47 | Evidencia en este baseline |
| --- | --- |
| AC-01 Baseline AS-IS versionado con alcance y corte | Seccion **1** |
| AC-02 Inventario backend auth/rbac | Seccion **2** + referencias a `backend/config/urls.py`, `authentication/urls.py`, `administracion/urls.py` |
| AC-03 Inventario frontend auth/rbac (features/routes/guards/API client) | Seccion **3** + referencias `frontend/src/routes/*` y `frontend/src/api/resources/*` |
| AC-04 Snapshot DB/modelos/migraciones + ownership notes | Seccion **4** + refs de modelos/migraciones/politica DB |
| AC-05 Controles actuales de seguridad/trazabilidad (JWT/CSRF/cookies/request-id) | Seccion **5** |
| AC-06 Mapa de contratos/endpoints criticos y consumo FE | Seccion **6** + refs `docs/api/modules/*.md` |
| AC-07 Acoplamientos/riesgos/deuda priorizados P1/P2/P3 | Seccion **7** |
| AC-08 Trazabilidad AC -> evidencia + DoD verificable | Secciones **8** y **9** |
| AC-09 Discoverability en indices de docs | Cambios en `docs/domains/auth-access/README.md` y `docs/README.md` |
| AC-10 Registro de trazabilidad documental | Cambios en `docs/domains/auth-access/changelog.md` y `decision-log.md` |

## 9) DoD KAN-47 (checklist verificable)

- [x] Existe documento canonico `baseline-as-is.md` en `docs/domains/auth-access/`.
- [x] Incluye alcance, fecha de corte y restricciones AS-IS.
- [x] Incluye inventario backend auth/rbac con rutas y responsabilidad.
- [x] Incluye inventario frontend auth/rbac (features/routes/guards/API client).
- [x] Incluye snapshot DB/modelos/migraciones y notas de ownership.
- [x] Incluye controles actuales de seguridad/trazabilidad (JWT/CSRF/cookies/request-id).
- [x] Incluye mapa de endpoints/contratos criticos y consumo FE.
- [x] Incluye riesgos/deuda priorizados P1/P2/P3.
- [x] Incluye matriz explicita AC KAN-47 -> evidencia.
- [x] Se enlaza desde `docs/domains/auth-access/README.md`.
- [x] Se enlaza desde `docs/README.md`.
- [x] Se registra en `changelog.md` y `decision-log.md` del dominio.

## 10) Referencias

- `docs/domains/auth-access/README.md`
- `docs/api/modules/auth.md`
- `docs/api/modules/rbac.md`
- `docs/api/modules/catalogos.md`
- `docs/architecture/domain-map.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `backend/config/urls.py`
- `backend/config/settings.py`
- `frontend/src/routes/Routes.tsx`
