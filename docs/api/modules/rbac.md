# API RBAC - Contratos

Contratos de roles, permisos y administracion de usuarios.
La fuente de verdad es `docs/api/standards.md` y los tipos en
`frontend/src/api/types/`.

Base URL
```
http://localhost:5000/api/v1
```

Reglas clave
- Respuestas y errores siguen `docs/api/standards.md`.
- Campos en camelCase (segun tipos del frontend).

Roles
| Metodo | Ruta | Request | Response |
| --- | --- | --- | --- |
| GET | `/roles` | `RolesListParams` | `RolesListResponse` |
| GET | `/roles/:id` | - | `RoleDetailResponse` |
| POST | `/roles` | `CreateRoleRequest` | `CreateRoleResponse` |
| PUT | `/roles/:id` | `UpdateRoleRequest` | `UpdateRoleResponse` |
| DELETE | `/roles/:id` | - | `DeleteRoleResponse` |

Permisos de rol
| Metodo | Ruta | Request | Response |
| --- | --- | --- | --- |
| POST | `/permissions/assign` | `AssignPermissionsRequest` | `AssignPermissionsResponse` |
| DELETE | `/permissions/roles/:roleId/permissions/:permissionId` | - | `RevokePermissionsResponse` |

Catalogo de permisos
| Metodo | Ruta | Request | Response |
| --- | --- | --- | --- |
| GET | `/permissions` | - | `PermissionCatalogResponse` |

Usuarios (core)
| Metodo | Ruta | Request | Response |
| --- | --- | --- | --- |
| GET | `/users` | `UsersListParams` | `UsersListResponse` |
| GET | `/users/:id` | - | `UserDetailResponse` |
| POST | `/users` | `CreateUserRequest` | `CreateUserResponse` |
| PATCH | `/users/:id` | `UpdateUserRequest` | `UpdateUserResponse` |
| PATCH | `/users/:id/activate` | - | `UserStatusResponse` |
| PATCH | `/users/:id/deactivate` | - | `UserStatusResponse` |

Usuarios - roles
| Metodo | Ruta | Request | Response |
| --- | --- | --- | --- |
| POST | `/users/:id/roles` | `AssignRolesRequest` | `AssignRolesResponse` |
| PUT | `/users/:id/roles/primary` | `SetPrimaryRoleRequest` | `SetPrimaryRoleResponse` |
| DELETE | `/users/:id/roles/:roleId` | - | `RevokeRoleResponse` |

Usuarios - overrides
| Metodo | Ruta | Request | Response |
| --- | --- | --- | --- |
| POST | `/users/:id/overrides` | `AddUserOverrideRequest` | `AddUserOverrideResponse` |
| DELETE | `/users/:id/overrides/:code` | - | `RemoveUserOverrideResponse` |

Tipos y referencias
- `frontend/src/api/types/roles.types.ts`
- `frontend/src/api/types/permissions.types.ts`
- `frontend/src/api/types/users.types.ts`
- `frontend/src/api/resources/roles.api.ts`
- `frontend/src/api/resources/permissions.api.ts`
- `frontend/src/api/resources/users.api.ts`
