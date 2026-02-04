# API RBAC - Contratos

> TL;DR: Contratos completos de RBAC (roles, permisos, usuarios y overrides). Incluye mapeo BD, algoritmo de permisos, reglas de negocio y endpoints esperados por el frontend.

## Problem / Context

RBAC define el acceso al sistema y un mismatch rompe seguridad, UI y auditoria. Este documento consolida el contrato real desde migraciones, seed y tipos del frontend.

**Fuente de verdad**
- `docs/api/standards.md`
- `backend/apps/catalogos/migrations/0001_initial.py`
- `backend/apps/administracion/migrations/0001_initial.py`
- `backend/apps/authentication/migrations/0001_initial.py`
- `backend/apps/authentication/migrations/0002_det_usuario.py`
- `backend/seed_e2e.py`
- `frontend/src/api/types/roles.types.ts`
- `frontend/src/api/types/permissions.types.ts`
- `frontend/src/api/types/users.types.ts`
- `frontend/src/api/resources/roles.api.ts`
- `frontend/src/api/resources/permissions.api.ts`
- `frontend/src/api/resources/users.api.ts`

Base URL
```
http://localhost:5000/api/v1
```

## Solution / Implementation

### Convenciones
- Respuestas y errores siguen `docs/api/standards.md`.
- Campos en camelCase (segun tipos del frontend).
- Mutaciones requieren `X-CSRF-TOKEN`.
- Relaciones usan baja logica con `fch_baja` (no delete fisico).
- Para permisos efectivos: solo entidades activas (`est_activo = true`) y relaciones activas (`fch_baja is null`).

### Modelo de datos (BD)
| Tabla | Campos clave | Notas |
| --- | --- | --- |
| `cat_roles` | `id_rol`, `rol`, `desc_rol`, `landing_route`, `is_admin`, `es_sistema`, `est_activo`, `fch_alta`, `fch_modf`, `fch_baja`, `usr_alta/modf/baja` | `rol` unico; `is_admin` => permisos `*` |
| `cat_permisos` | `id_permiso`, `codigo`, `descripcion`, `es_sistema`, `est_activo`, `fch_alta/modf/baja`, `usr_alta/modf/baja` | `codigo` unico; estructura `grupo:modulo:submodulo:accion` |
| `rel_usuario_roles` | `id_usuario_rol`, `id_usuario`, `id_rol`, `is_primary`, `fch_asignacion`, `fch_baja`, `usr_asignacion`, `usr_baja` | unique (`id_usuario`, `id_rol`); index (`id_usuario`, `is_primary`) |
| `rel_rol_permisos` | `id_rol_permiso`, `id_rol`, `id_permiso`, `fch_asignacion`, `fch_baja`, `usr_asignacion`, `usr_baja` | unique (`id_rol`, `id_permiso`) |
| `rel_usuario_overrides` | `id_override`, `id_usuario`, `id_permiso`, `efecto`, `fch_asignacion`, `fch_expira`, `fch_baja`, `usr_asignacion`, `usr_baja` | unique (`id_usuario`, `id_permiso`); `efecto` = `ALLOW | DENY` |
| `sy_usuarios` | `id_usuario`, `usuario`, `correo`, `est_activo`, `est_bloqueado`, `cambiar_clave`, `terminos_acept`, `last_conexion`, `ip_ultima`, `fch_alta/modf/baja`, `usr_alta/modf/baja` | base auth + estado |
| `det_usuarios` | `id_usuario`, `nombre`, `paterno`, `materno`, `nombre_completo`, `id_centro_atencion` | perfil + clinica |

### Mapeo API -> BD

**RoleListItem / RoleDetail**
| Campo API | Fuente BD | Notas |
| --- | --- | --- |
| `id` | `cat_roles.id_rol` | PK |
| `name` | `cat_roles.rol` | codigo del rol |
| `description` | `cat_roles.desc_rol` |  |
| `landingRoute` | `cat_roles.landing_route` | puede ser `null` |
| `isActive` | `cat_roles.est_activo` |  |
| `isSystem` | `cat_roles.es_sistema` |  |
| `permissionsCount` | `rel_rol_permisos` | solo relaciones activas |
| `usersCount` | `rel_usuario_roles` | solo relaciones activas |
| `createdAt/By` | `fch_alta` / `usr_alta` | `UserRef` |
| `updatedAt/By` | `fch_modf` / `usr_modf` | `UserRef` |

**RolePermission**
| Campo API | Fuente BD | Notas |
| --- | --- | --- |
| `id` | `cat_permisos.id_permiso` |  |
| `code` | `cat_permisos.codigo` |  |
| `description` | `cat_permisos.descripcion` |  |
| `assignedAt/By` | `rel_rol_permisos.fch_asignacion` / `usr_asignacion` |  |

**Permission**
| Campo API | Fuente BD | Notas |
| --- | --- | --- |
| `id` | `cat_permisos.id_permiso` |  |
| `code` | `cat_permisos.codigo` |  |
| `description` | `cat_permisos.descripcion` |  |
| `isSystem` | `cat_permisos.es_sistema` |  |

**UserListItem / UserDetail**
| Campo API | Fuente BD | Notas |
| --- | --- | --- |
| `id` | `sy_usuarios.id_usuario` |  |
| `username` | `sy_usuarios.usuario` |  |
| `fullname` | `det_usuarios.nombre_completo` |  |
| `email` | `sy_usuarios.correo` |  |
| `clinic` | `det_usuarios.id_centro_atencion` | `CentroAtencionRef` |
| `primaryRole` | `cat_roles.rol` | via `rel_usuario_roles.is_primary` |
| `isActive` | `sy_usuarios.est_activo` |  |
| `firstName` | `det_usuarios.nombre` |  |
| `paternalName` | `det_usuarios.paterno` |  |
| `maternalName` | `det_usuarios.materno` |  |
| `termsAccepted` | `sy_usuarios.terminos_acept` |  |
| `mustChangePassword` | `sy_usuarios.cambiar_clave` |  |
| `lastLoginAt` | `sy_usuarios.last_conexion` |  |
| `lastIp` | `sy_usuarios.ip_ultima` |  |
| `createdAt/By` | `sy_usuarios.fch_alta` / `usr_alta` | `UserRef` |
| `updatedAt/By` | `sy_usuarios.fch_modf` / `usr_modf` | `UserRef` |

**UserRole**
| Campo API | Fuente BD | Notas |
| --- | --- | --- |
| `id` | `cat_roles.id_rol` |  |
| `name` | `cat_roles.rol` |  |
| `description` | `cat_roles.desc_rol` |  |
| `isPrimary` | `rel_usuario_roles.is_primary` |  |
| `assignedAt/By` | `rel_usuario_roles.fch_asignacion` / `usr_asignacion` |  |

**UserOverride**
| Campo API | Fuente BD | Notas |
| --- | --- | --- |
| `id` | `rel_usuario_overrides.id_override` |  |
| `permissionCode` | `cat_permisos.codigo` |  |
| `permissionDescription` | `cat_permisos.descripcion` |  |
| `effect` | `rel_usuario_overrides.efecto` | `ALLOW | DENY` |
| `expiresAt` | `rel_usuario_overrides.fch_expira` | puede ser `null` |
| `isExpired` | derivado | `now > fch_expira` |
| `assignedAt/By` | `rel_usuario_overrides.fch_asignacion` / `usr_asignacion` |  |

### Resolucion de permisos (backend)
1. Roles activos: `rel_usuario_roles` con `fch_baja is null` + `cat_roles.est_activo = true`.
2. Si algun rol tiene `is_admin = true` => `permissions: ["*"]` y no se aplican overrides.
3. Permisos por rol: `rel_rol_permisos` activos + `cat_permisos.est_activo = true`.
4. Overrides activos: `rel_usuario_overrides.fch_baja is null` y `fch_expira` nulo o futuro.
5. `DENY` quita, `ALLOW` agrega.
6. Orden final: alfabetico por `codigo`.
7. `primaryRole`: primer `is_primary`; si no hay, usar el primer rol activo; si no hay roles => `primaryRole = ""` y `landingRoute = null`.

### Endpoints

Roles
| Metodo | Ruta | Request | Response | Permiso |
| --- | --- | --- | --- | --- |
| GET | `/roles` | `RolesListParams` | `RolesListResponse` | `admin:gestion:roles:read` |
| GET | `/roles/:id` | - | `RoleDetailResponse` | `admin:gestion:roles:read` |
| POST | `/roles` | `CreateRoleRequest` | `CreateRoleResponse` | `admin:gestion:roles:create` |
| PUT | `/roles/:id` | `UpdateRoleRequest` | `UpdateRoleResponse` | `admin:gestion:roles:update` |
| DELETE | `/roles/:id` | - | `DeleteRoleResponse` | `admin:gestion:roles:delete` |

Permisos de rol
| Metodo | Ruta | Request | Response | Permiso |
| --- | --- | --- | --- | --- |
| POST | `/permissions/assign` | `AssignPermissionsRequest` | `AssignPermissionsResponse` | `admin:gestion:roles:update` |
| DELETE | `/permissions/roles/:roleId/permissions/:permissionId` | - | `RevokePermissionsResponse` | `admin:gestion:roles:update` |

Catalogo de permisos
| Metodo | Ruta | Request | Response | Permiso |
| --- | --- | --- | --- | --- |
| GET | `/permissions` | - | `PermissionCatalogResponse` | `admin:gestion:permisos:read` |

Usuarios (core)
| Metodo | Ruta | Request | Response | Permiso |
| --- | --- | --- | --- | --- |
| GET | `/users` | `UsersListParams` | `UsersListResponse` | `admin:gestion:usuarios:read` |
| GET | `/users/:id` | - | `UserDetailResponse` | `admin:gestion:usuarios:read` |
| POST | `/users` | `CreateUserRequest` | `CreateUserResponse` | `admin:gestion:usuarios:create` |
| PATCH | `/users/:id` | `UpdateUserRequest` | `UpdateUserResponse` | `admin:gestion:usuarios:update` |
| PATCH | `/users/:id/activate` | - | `UserStatusResponse` | `admin:gestion:usuarios:update` |
| PATCH | `/users/:id/deactivate` | - | `UserStatusResponse` | `admin:gestion:usuarios:update` |

Usuarios - roles
| Metodo | Ruta | Request | Response | Permiso |
| --- | --- | --- | --- | --- |
| POST | `/users/:id/roles` | `AssignRolesRequest` | `AssignRolesResponse` | `admin:gestion:usuarios:update` |
| PUT | `/users/:id/roles/primary` | `SetPrimaryRoleRequest` | `SetPrimaryRoleResponse` | `admin:gestion:usuarios:update` |
| DELETE | `/users/:id/roles/:roleId` | - | `RevokeRoleResponse` | `admin:gestion:usuarios:update` |

Usuarios - overrides
| Metodo | Ruta | Request | Response | Permiso |
| --- | --- | --- | --- | --- |
| POST | `/users/:id/overrides` | `AddUserOverrideRequest` | `AddUserOverrideResponse` | `admin:gestion:usuarios:update` |
| DELETE | `/users/:id/overrides/:code` | - | `RemoveUserOverrideResponse` | `admin:gestion:usuarios:update` |

**Notas de contrato**
- Listados soportan `PaginationParams`: `page`, `pageSize`, `search`, `sortBy`, `sortOrder`.
- `AssignPermissionsRequest` acepta `roleId`/`role_id` y `permissionIds`/`permission_ids` (compat legacy).
- `RemoveUserOverride` usa `:code` (permissionCode) en la ruta. El frontend no usa `overrideId`.

### Reglas de negocio y edge cases
- Un usuario no puede quedar sin roles activos. Revocar el ultimo rol debe fallar.
- Siempre debe existir un rol primario cuando hay roles; `setPrimary` debe limpiar los demas.
- Si se revoca el rol primario, asignar otro rol activo como primario en la misma transaccion.
- `es_sistema = true` implica solo lectura (no update/delete) en roles y permisos.
- `is_admin = true` devuelve permisos `*` y overrides no aplican.
- Overrides expirados o dados de baja no afectan permisos.
- Overrides deben ser idempotentes (unique por usuario+permiso). Si existe, actualizar `efecto`/`fch_expira`.
- Asignacion bulk de permisos debe ser transaccional y tratar la lista como set final.
- No permitir baja logica de rol con usuarios activos asignados.
- `permissionsCount` y `usersCount` deben contar solo relaciones activas.
- Dependencias de permisos: si se otorga `*:create/update/delete` sin `*:read` del mismo recurso, agregar `:read` o rechazar. Si se revoca `:read` y quedan permisos de escritura, rechazar.
- `CreateUser` debe generar `temporaryPassword` y dejar `cambiar_clave = true` y `terminos_acept = false` para forzar onboarding.

### Seed E2E (backend/seed_e2e.py)

**Password default**
- `Sires_123456`

**Permisos base**
| Code | Descripcion |
| --- | --- |
| `admin:gestion:usuarios:read` | Admin - Ver usuarios y perfiles |
| `admin:gestion:expedientes:read` | Admin - Ver expedientes |
| `admin:gestion:roles:read` | Admin - Ver roles |
| `admin:catalogos:centros_atencion:read` | Admin - Ver centros de atencion |
| `admin:catalogos:areas:read` | Admin - Ver areas |
| `admin:reportes:read` | Admin - Ver reportes |
| `admin:estadisticas:read` | Admin - Ver estadisticas |
| `admin:autorizacion:recetas:read` | Admin - Autorizacion recetas |
| `admin:autorizacion:estudios:read` | Admin - Autorizacion estudios |
| `admin:licencias:read` | Admin - Licencias |
| `admin:conciliacion:read` | Admin - Conciliacion |
| `clinico:consultas:read` | Clinico - Ver consultas |
| `clinico:consultas:agenda:read` | Clinico - Ver agenda |
| `clinico:consultas:create` | Clinico - Crear consulta |
| `clinico:consultas:historial:read` | Clinico - Ver historial |
| `clinico:expedientes:read` | Clinico - Ver expedientes |
| `clinico:expedientes:create` | Clinico - Crear expediente |
| `clinico:somatometria:read` | Clinico - Ver somatometria |
| `recepcion:fichas:medicina_general:create` | Recepcion - Ficha medicina general |
| `recepcion:fichas:especialidad:create` | Recepcion - Ficha especialidad |
| `recepcion:fichas:urgencias:create` | Recepcion - Ficha urgencias |
| `recepcion:incapacidad:create` | Recepcion - Incapacidad |
| `farmacia:recetas:dispensar` | Farmacia - Dispensar recetas |
| `farmacia:inventario:update` | Farmacia - Actualizar inventario |
| `urgencias:triage:read` | Urgencias - Ver triage |

**Roles base**
| Code | Descripcion | Landing | is_admin | Permisos |
| --- | --- | --- | --- | --- |
| `ADMIN` | Administrador | `/admin/roles` | true | `*` |
| `ADMIN_USUARIOS` | Admin Usuarios | `/admin/usuarios` | false | `admin:gestion:usuarios:read` |
| `ADMIN_EXPEDIENTES` | Admin Expedientes | `/admin/expedientes` | false | `admin:gestion:expedientes:read` |
| `ADMIN_ROLES` | Admin Roles | `/admin/roles` | false | `admin:gestion:roles:read` |
| `ADMIN_CATALOGOS` | Admin Catalogos | `/admin/catalogos` | false | `admin:catalogos:centros_atencion:read`, `admin:catalogos:areas:read` |
| `ADMIN_REPORTES` | Admin Reportes | `/admin/reportes` | false | `admin:reportes:read` |
| `ADMIN_ESTADISTICAS` | Admin Estadisticas | `/admin/estadisticas` | false | `admin:estadisticas:read` |
| `ADMIN_AUTORIZACION` | Admin Autorizacion | `/admin/autorizacion/recetas` | false | `admin:autorizacion:recetas:read`, `admin:autorizacion:estudios:read` |
| `ADMIN_LICENCIAS` | Admin Licencias | `/admin/licencias` | false | `admin:licencias:read` |
| `ADMIN_CONCILIACION` | Admin Conciliacion | `/admin/conciliacion` | false | `admin:conciliacion:read` |
| `CLINICO` | Clinico | `/clinico/consultas` | false | `clinico:consultas:read`, `clinico:consultas:agenda:read`, `clinico:consultas:create`, `clinico:consultas:historial:read`, `clinico:expedientes:read`, `clinico:expedientes:create`, `clinico:somatometria:read` |
| `RECEPCION` | Recepcion | `/recepcion/fichas/medicina-general` | false | `recepcion:fichas:medicina_general:create`, `recepcion:fichas:especialidad:create`, `recepcion:fichas:urgencias:create`, `recepcion:incapacidad:create` |
| `FARMACIA` | Farmacia | `/farmacia/recetas` | false | `farmacia:recetas:dispensar`, `farmacia:inventario:update` |
| `URGENCIAS` | Urgencias | `/urgencias/triage` | false | `urgencias:triage:read` |

**Usuarios de prueba**
- `admin`, `admin_usuarios`, `admin_expedientes`, `admin_roles`, `admin_catalogos`, `admin_reportes`, `admin_estadisticas`, `admin_autorizacion`, `admin_licencias`, `admin_conciliacion`, `clinico`, `recepcion`, `farmacia`, `urgencias`.
- Estados especiales: `usuario_inactivo`, `usuario_bloqueado`, `usuario_onboarding`, `usuario_cambiar_clave`, `usuario_sin_centros`.
- Variantes por rol: `usuario_onboarding_*`, `usuario_cambiar_clave_*`, `usuario_inactivo_*`, `usuario_bloqueado_*`.
- Multirol: `usuario_multirol` (CLINICO + RECEPCION + FARMACIA).

### Brechas detectadas vs frontend
- Faltan permisos en seed para operaciones esperadas por UI:
  - `admin:gestion:roles:create`, `admin:gestion:roles:update`, `admin:gestion:roles:delete`.
  - `admin:gestion:usuarios:create`, `admin:gestion:usuarios:update`.
  - `admin:gestion:permisos:read`.
- `RemoveUserOverride` en UI usa `permissionCode` en la ruta, no `overrideId`.

## Examples

**Crear rol**
```json
{
  "name": "AUDITORIA",
  "description": "Auditoria",
  "landingRoute": "/admin/auditoria"
}
```

**Asignar permisos (bulk)**
```json
{
  "roleId": 21,
  "permissionIds": [1, 2, 3]
}
```

**Detalle de usuario (con roles y overrides)**
```json
{
  "user": {
    "id": 12,
    "username": "recepcion",
    "fullname": "Recepcion Demo",
    "email": "recepcion@sires.local",
    "clinic": {"id": 1, "name": "Centro de Atencion Local"},
    "primaryRole": "RECEPCION",
    "isActive": true,
    "firstName": "Recepcion",
    "paternalName": "Demo",
    "maternalName": "",
    "termsAccepted": true,
    "mustChangePassword": false,
    "lastLoginAt": null,
    "lastIp": null,
    "createdAt": "2026-02-04T12:00:00Z",
    "createdBy": {"id": 1, "name": "Admin Sistema"},
    "updatedAt": null,
    "updatedBy": null
  },
  "roles": [
    {
      "id": 7,
      "name": "RECEPCION",
      "description": "Recepcion",
      "isPrimary": true,
      "assignedAt": "2026-02-04T12:00:00Z",
      "assignedBy": {"id": 1, "name": "Admin Sistema"}
    }
  ],
  "overrides": []
}
```

## References
- `docs/api/standards.md`
- `backend/apps/catalogos/migrations/0001_initial.py`
- `backend/apps/administracion/migrations/0001_initial.py`
- `backend/apps/authentication/migrations/0001_initial.py`
- `backend/apps/authentication/migrations/0002_det_usuario.py`
- `backend/seed_e2e.py`
- `frontend/src/api/types/roles.types.ts`
- `frontend/src/api/types/permissions.types.ts`
- `frontend/src/api/types/users.types.ts`
- `frontend/src/api/resources/roles.api.ts`
- `frontend/src/api/resources/permissions.api.ts`
- `frontend/src/api/resources/users.api.ts`
