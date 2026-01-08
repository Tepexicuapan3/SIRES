# API RBAC - Contratos para Frontend

> **TL;DR:** Documentacion completa de endpoints RBAC para implementar el modulo de administracion en frontend. Incluye roles, permisos, asignaciones y overrides de usuario.

---

## Base URL

```
http://localhost:5000/api/v1
```

## Headers Requeridos

```
Cookie: access_token_cookie=<jwt>
X-CSRF-TOKEN: <csrf_token>
Content-Type: application/json
```

---

## Resumen de Endpoints

### Roles (`/api/v1/roles`)

| Metodo | Ruta | Permiso | Descripcion |
|--------|------|---------|-------------|
| POST | `/roles` | `roles:create` | Crear rol |
| GET | `/roles` | `roles:read` | Listar roles |
| GET | `/roles/:id` | `roles:read` | Detalle de rol |
| PUT | `/roles/:id` | `roles:update` | Actualizar rol |
| DELETE | `/roles/:id` | `roles:delete` | Eliminar rol (baja logica) |

### Permisos (`/api/v1/permissions`)

| Metodo | Ruta | Permiso | Descripcion |
|--------|------|---------|-------------|
| GET | `/permissions/me` | - | Mis permisos (usuario auth) |
| GET | `/permissions/user/:id` | `usuarios:read` | Permisos de usuario |
| GET | `/permissions/` | `permisos:read` | Listar permisos |
| GET | `/permissions/:id` | `permisos:read` | Detalle de permiso |
| POST | `/permissions/` | `permisos:create` | Crear permiso custom |
| PUT | `/permissions/:id` | `permisos:update` | Actualizar permiso |
| DELETE | `/permissions/:id` | `permisos:delete` | Eliminar permiso |
| GET | `/permissions/roles` | `roles:read` | Listar roles con counts |
| GET | `/permissions/role/:id` | `roles:read` | Permisos de un rol |
| POST | `/permissions/role/:id/assign` | `permisos:assign` | Asignar permiso a rol |
| POST | `/permissions/role/:id/revoke` | `permisos:assign` | Revocar permiso de rol |
| POST | `/permissions/assign` | `permisos:assign` | Asignar multiples permisos |
| DELETE | `/permissions/roles/:role_id/permissions/:perm_id` | `permisos:assign` | Quitar permiso de rol |

### Overrides de Usuario (`/api/v1/permissions/users`)

| Metodo | Ruta | Permiso | Descripcion |
|--------|------|---------|-------------|
| POST | `/permissions/users/:id/overrides` | `usuarios:update` | Agregar override |
| GET | `/permissions/users/:id/overrides` | `usuarios:read` | Listar overrides |
| DELETE | `/permissions/users/:id/overrides/:code` | `usuarios:update` | Eliminar override |
| GET | `/permissions/users/:id/effective` | `usuarios:read` | Permisos efectivos |

### Usuarios - RBAC (`/api/v1/users`)

| Metodo | Ruta | Permiso | Descripcion |
|--------|------|---------|-------------|
| POST | `/users/:id/roles` | `usuarios:update` | Asignar roles |
| PUT | `/users/:id/roles/primary` | `usuarios:update` | Cambiar rol primario |
| DELETE | `/users/:id/roles/:role_id` | `usuarios:update` | Revocar rol |

---

## Formato de Respuestas

### Respuesta Exitosa

```json
{
  "message": "Operacion exitosa",
  "data": { ... }
}
```

### Respuesta de Error

```json
{
  "code": "ERROR_CODE",
  "message": "Mensaje descriptivo en espanol"
}
```

---

## Endpoints de Roles (`/api/v1/roles`)

### POST /roles - Crear Rol

**Permiso:** `roles:create`

**Request:**
```json
{
  "rol": "ENFERMERIA",
  "desc_rol": "Personal de enfermeria",
  "tp_rol": "ADMIN",
  "landing_route": "/nursing",
  "priority": 5,
  "is_admin": false
}
```

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `rol` | string | Si | - | Nombre unico del rol |
| `desc_rol` | string | Si | - | Descripcion |
| `tp_rol` | string | No | "ADMIN" | Tipo de rol |
| `landing_route` | string | No | null | Ruta inicial post-login |
| `priority` | int | No | 999 | Prioridad (menor = mas importante) |
| `is_admin` | bool | No | false | Si tiene permisos admin |

**Response 201:**
```json
{
  "id_rol": 23,
  "rol": "ENFERMERIA",
  "desc_rol": "Personal de enfermeria",
  "tp_rol": "ADMIN",
  "landing_route": "/nursing",
  "priority": 5,
  "is_admin": false,
  "est_rol": "A"
}
```

**Errores:**
- `400` - `ROLE_NAME_REQUIRED`, `ROLE_DESCRIPTION_REQUIRED`
- `409` - `ROLE_NAME_DUPLICATE`
- `500` - `DATABASE_ERROR`

---

### GET /roles - Listar Roles

**Permiso:** `roles:read`

**Query Params:**
- `include_inactive=true` - Incluir roles inactivos (default: false)

**Response 200:**
```json
{
  "total": 23,
  "roles": [
    {
      "id_rol": 1,
      "rol": "MEDICOS",
      "desc_rol": "Medicos del servicio",
      "landing_route": "/consultas",
      "priority": 2,
      "is_admin": 0,
      "est_rol": "A",
      "permissions_count": 45,
      "users_count": 12
    }
  ]
}
```

---

### GET /roles/:id - Detalle de Rol

**Permiso:** `roles:read`

**Response 200:**
```json
{
  "id_rol": 5,
  "rol": "ENFERMERIA",
  "desc_rol": "Personal de enfermeria",
  "landing_route": "/nursing",
  "priority": 5,
  "is_admin": false,
  "est_rol": "A"
}
```

**Errores:**
- `404` - `ROLE_NOT_FOUND`

---

### PUT /roles/:id - Actualizar Rol

**Permiso:** `roles:update`

**Request (todos opcionales):**
```json
{
  "rol": "NUEVO_NOMBRE",
  "desc_rol": "Nueva descripcion",
  "landing_route": "/nueva-ruta",
  "priority": 10
}
```

**Campos permitidos:** `rol`, `desc_rol`, `tp_rol`, `landing_route`, `priority`

**Response 200:** Rol actualizado

**Errores:**
- `400` - `NO_FIELDS_TO_UPDATE`
- `403` - `ROLE_SYSTEM_PROTECTED`
- `404` - `ROLE_NOT_FOUND`
- `409` - `ROLE_NAME_DUPLICATE`

---

### DELETE /roles/:id - Eliminar Rol

**Permiso:** `roles:delete`

**Response 204:** Sin contenido

**Errores:**
- `400` - `ROLE_HAS_USERS`
- `403` - `ROLE_SYSTEM_PROTECTED`
- `404` - `ROLE_NOT_FOUND`

---

## Endpoints de Permisos (`/api/v1/permissions`)

### GET /permissions/me - Mis Permisos

**Permiso:** Ninguno (usuario autenticado)

**Response 200:**
```json
{
  "user_id": 123,
  "is_admin": false,
  "roles": [
    {"id_rol": 2, "rol": "MEDICOS", "desc_rol": "Medicos"}
  ],
  "permissions": ["expedientes:read", "consultas:create"],
  "landing_route": "/consultas",
  "overrides": [
    {
      "permission_code": "expedientes:delete",
      "effect": "DENY",
      "expires_at": null,
      "is_expired": false
    }
  ]
}
```

---

### GET /permissions/ - Listar Permisos

**Permiso:** `permisos:read`

**Response 200:**
```json
{
  "permissions": [
    {
      "id_permission": 1,
      "code": "expedientes:read",
      "resource": "expedientes",
      "action": "read",
      "description": "Ver expedientes",
      "category": "Expedientes"
    }
  ]
}
```

---

### GET /permissions/:id - Detalle de Permiso

**Permiso:** `permisos:read`

**Response 200:**
```json
{
  "permission": {
    "id_permission": 5,
    "code": "expedientes:read",
    "resource": "expedientes",
    "action": "read",
    "description": "Ver expedientes",
    "category": "Expedientes",
    "is_system": true
  }
}
```

**Errores:**
- `404` - `PERMISSION_NOT_FOUND`

---

### POST /permissions/ - Crear Permiso

**Permiso:** `permisos:create`

**Request:**
```json
{
  "code": "expedientes:export",
  "resource": "expedientes",
  "action": "export",
  "description": "Exportar expedientes a PDF/Excel",
  "category": "Expedientes"
}
```

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `code` | string | Si |
| `resource` | string | Si |
| `action` | string | Si |
| `description` | string | No |
| `category` | string | No |

**Response 201:**
```json
{
  "message": "Permiso creado exitosamente",
  "permission": {
    "id_permission": 70,
    "code": "expedientes:export",
    "is_system": false
  }
}
```

**Errores:**
- `400` - `PERMISSION_CODE_INVALID`, `MISSING_REQUIRED_FIELDS`
- `409` - `PERMISSION_CODE_EXISTS`

---

### PUT /permissions/:id - Actualizar Permiso

**Permiso:** `permisos:update`

**Request:**
```json
{
  "description": "Nueva descripcion",
  "category": "Nueva categoria"
}
```

**Nota:** Solo `description` y `category` son editables. Permisos del sistema no se pueden modificar.

**Response 200:**
```json
{
  "message": "Permiso actualizado exitosamente",
  "permission": { ... }
}
```

**Errores:**
- `403` - `PERMISSION_SYSTEM_PROTECTED`
- `404` - `PERMISSION_NOT_FOUND`

---

### DELETE /permissions/:id - Eliminar Permiso

**Permiso:** `permisos:delete`

**Response 204:** Sin contenido

**Errores:**
- `400` - `PERMISSION_IN_USE`
- `403` - `PERMISSION_SYSTEM_PROTECTED`
- `404` - `PERMISSION_NOT_FOUND`

---

### GET /permissions/role/:id - Permisos de un Rol

**Permiso:** `roles:read`

**Response 200:**
```json
{
  "role_id": 2,
  "total": 19,
  "permissions": [
    {
      "id_permission": 5,
      "code": "expedientes:read",
      "resource": "expedientes",
      "action": "read",
      "description": "Ver expedientes",
      "category": "EXPEDIENTES"
    }
  ]
}
```

---

### POST /permissions/role/:id/assign - Asignar Permiso a Rol

**Permiso:** `permisos:assign`

**Request:**
```json
{
  "permission_id": 15
}
```

**Response 200:**
```json
{
  "message": "Permiso asignado correctamente",
  "role_id": 2,
  "permission_id": 15
}
```

**Errores:**
- `400` - `INVALID_REQUEST`
- `404` - `ROLE_NOT_FOUND`
- `500` - `ASSIGNMENT_FAILED`

---

### POST /permissions/role/:id/revoke - Revocar Permiso de Rol

**Permiso:** `permisos:assign`

**Request:**
```json
{
  "permission_id": 15
}
```

**Response 200:**
```json
{
  "message": "Permiso revocado correctamente",
  "role_id": 2,
  "permission_id": 15
}
```

**Errores:**
- `404` - `NOT_FOUND`

---

### POST /permissions/assign - Asignar Multiples Permisos

**Permiso:** `permisos:assign`

**Request:**
```json
{
  "role_id": 5,
  "permission_ids": [1, 5, 10, 15]
}
```

**Response 200:**
```json
{
  "message": "Permisos asignados exitosamente",
  "role_id": 5,
  "assigned_count": 4
}
```

**Errores:**
- `400` - `EMPTY_PERMISSION_LIST`, `INVALID_PERMISSIONS`
- `404` - `ROLE_NOT_FOUND`

---

## Overrides de Usuario (`/api/v1/permissions/users`)

### POST /permissions/users/:id/overrides - Agregar Override

**Permiso:** `usuarios:update`

**Request:**
```json
{
  "permission_code": "expedientes:delete",
  "effect": "ALLOW",
  "expires_at": "2026-12-31T23:59:59"
}
```

| Campo | Tipo | Requerido | Valores |
|-------|------|-----------|---------|
| `permission_code` | string | Si | Codigo del permiso |
| `effect` | string | Si | `ALLOW` o `DENY` |
| `expires_at` | string | No | ISO 8601 format |

**Response 201:**
```json
{
  "message": "Override de permiso agregado correctamente",
  "user_id": 45,
  "permission_code": "expedientes:delete",
  "effect": "ALLOW",
  "expires_at": "2026-12-31T23:59:59"
}
```

**Errores:**
- `400` - `INVALID_REQUEST`, `INVALID_EFFECT`, `INVALID_EXPIRATION_DATE`
- `404` - `USER_NOT_FOUND`, `PERMISSION_NOT_FOUND`

---

### GET /permissions/users/:id/overrides - Listar Overrides

**Permiso:** `usuarios:read`

**Response 200:**
```json
{
  "user_id": 45,
  "overrides": [
    {
      "id_user_permission_override": 1,
      "permission_code": "expedientes:delete",
      "permission_description": "Eliminar expedientes",
      "effect": "DENY",
      "expires_at": "2026-12-31T23:59:59",
      "is_expired": false
    }
  ]
}
```

---

### DELETE /permissions/users/:id/overrides/:code - Eliminar Override

**Permiso:** `usuarios:update`

**Response 200:**
```json
{
  "message": "Override de permiso eliminado correctamente",
  "user_id": 45,
  "permission_code": "expedientes:delete"
}
```

**Errores:**
- `400` - `OVERRIDE_ALREADY_DELETED`
- `404` - `USER_NOT_FOUND`, `PERMISSION_NOT_FOUND`, `OVERRIDE_NOT_FOUND`

---

### GET /permissions/users/:id/effective - Permisos Efectivos

**Permiso:** `usuarios:read`

**Response 200:**
```json
{
  "user_id": 45,
  "permissions": ["expedientes:read", "expedientes:create"],
  "is_admin": false,
  "roles": [
    {"id_rol": 1, "rol": "MEDICOS", "desc_rol": "Medicos"}
  ],
  "landing_route": "/consultas",
  "overrides": [
    {
      "permission_code": "expedientes:delete",
      "effect": "DENY",
      "expires_at": null,
      "is_expired": false
    }
  ]
}
```

---

## Usuarios - RBAC (`/api/v1/users`)

### POST /users/:id/roles - Asignar Roles

**Permiso:** `usuarios:update`

**Request:**
```json
{
  "role_ids": [1, 3, 5]
}
```

**Response 200:**
```json
{
  "message": "Roles asignados correctamente",
  "assigned_count": 2,
  "user_id": 45,
  "role_ids": [1, 3, 5]
}
```

**Errores:**
- `400` - `INVALID_REQUEST`, `EMPTY_ROLE_LIST`
- `404` - `USER_NOT_FOUND`, `ROLE_NOT_FOUND`

---

### PUT /users/:id/roles/primary - Cambiar Rol Primario

**Permiso:** `usuarios:update`

**Request:**
```json
{
  "role_id": 3
}
```

**Response 200:**
```json
{
  "message": "Rol primario actualizado correctamente",
  "user_id": 45,
  "role_id": 3
}
```

**Errores:**
- `400` - `ROLE_NOT_ASSIGNED`, `ROLE_INACTIVE`
- `404` - `USER_NOT_FOUND`

---

### DELETE /users/:id/roles/:role_id - Revocar Rol

**Permiso:** `usuarios:update`

**Response 200:**
```json
{
  "message": "Rol revocado correctamente",
  "user_id": 45,
  "role_id": 3,
  "reassigned_primary": true
}
```

**Nota:** Si se revoca el rol primario, se reasigna automaticamente otro rol como primario.

**Errores:**
- `400` - `CANNOT_REVOKE_LAST_ROLE`, `ROLE_NOT_ASSIGNED`, `ROLE_ALREADY_REVOKED`
- `404` - `USER_NOT_FOUND`

---

## Catalogo de Codigos de Error

### Autenticacion

| Codigo | Status | Mensaje |
|--------|--------|---------|
| `INVALID_CREDENTIALS` | 401 | Usuario o contrasena incorrectos |
| `USER_LOCKED` | 423 | Usuario temporalmente bloqueado |
| `USER_INACTIVE` | 403 | Usuario inactivo |

### Roles

| Codigo | Status | Mensaje |
|--------|--------|---------|
| `ROLE_NOT_FOUND` | 404 | Rol no encontrado |
| `ROLE_NAME_REQUIRED` | 400 | El nombre del rol es requerido |
| `ROLE_NAME_DUPLICATE` | 409 | Ya existe un rol con ese nombre |
| `ROLE_SYSTEM_PROTECTED` | 403 | Los roles del sistema no pueden ser modificados |
| `ROLE_HAS_USERS` | 400 | No se puede eliminar un rol con usuarios |
| `ROLE_NOT_ASSIGNED` | 400 | El rol no esta asignado al usuario |
| `ROLE_INACTIVE` | 400 | El rol esta inactivo o revocado |
| `CANNOT_REVOKE_LAST_ROLE` | 400 | No se puede revocar el unico rol |
| `EMPTY_ROLE_LIST` | 400 | La lista de roles no puede estar vacia |

### Permisos

| Codigo | Status | Mensaje |
|--------|--------|---------|
| `PERMISSION_NOT_FOUND` | 404 | Permiso no encontrado |
| `PERMISSION_CODE_REQUIRED` | 400 | Codigo de permiso requerido |
| `PERMISSION_CODE_INVALID` | 400 | Formato invalido (debe ser resource:action) |
| `PERMISSION_CODE_EXISTS` | 409 | Ya existe un permiso con ese codigo |
| `PERMISSION_SYSTEM_PROTECTED` | 403 | No se pueden modificar permisos del sistema |
| `PERMISSION_IN_USE` | 400 | Permiso asignado a roles |
| `INVALID_EFFECT` | 400 | Effect debe ser ALLOW o DENY |
| `OVERRIDE_NOT_FOUND` | 404 | Override de permiso no encontrado |
| `OVERRIDE_ALREADY_DELETED` | 400 | El override ya fue eliminado |

### Sistema

| Codigo | Status | Mensaje |
|--------|--------|---------|
| `SERVER_ERROR` | 500 | Error interno del servidor |
| `DB_CONNECTION_FAILED` | 500 | Error de conexion a la base de datos |
| `INVALID_REQUEST` | 400 | Solicitud invalida |
| `NO_FIELDS_TO_UPDATE` | 400 | No se proporciono ningun campo para actualizar |

---

## TypeScript Types

```typescript
// ============= ROLES =============

interface Role {
  id_rol: number;
  rol: string;
  desc_rol: string;
  tp_rol?: string;
  landing_route: string | null;
  priority: number;
  is_admin: number; // 0 | 1
  est_rol: 'A' | 'B';
  permissions_count?: number;
  users_count?: number;
}

interface CreateRoleRequest {
  rol: string;
  desc_rol: string;
  tp_rol?: string;
  landing_route?: string;
  priority?: number;
  is_admin?: boolean;
}

interface UpdateRoleRequest {
  rol?: string;
  desc_rol?: string;
  tp_rol?: string;
  landing_route?: string;
  priority?: number;
}

interface RolesListResponse {
  total: number;
  roles: Role[];
}

// ============= PERMISOS =============

interface Permission {
  id_permission: number;
  code: string;
  resource: string;
  action: string;
  description: string | null;
  category: string | null;
  is_system?: boolean;
}

interface CreatePermissionRequest {
  code: string;
  resource: string;
  action: string;
  description?: string;
  category?: string;
}

interface UpdatePermissionRequest {
  description?: string;
  category?: string;
}

interface PermissionsListResponse {
  permissions: Permission[];
}

interface RolePermissionsResponse {
  role_id: number;
  total: number;
  permissions: Permission[];
}

interface AssignPermissionsRequest {
  role_id: number;
  permission_ids: number[];
}

// ============= OVERRIDES =============

type OverrideEffect = 'ALLOW' | 'DENY';

interface PermissionOverride {
  id_user_permission_override?: number;
  permission_code: string;
  permission_description?: string;
  effect: OverrideEffect;
  expires_at: string | null;
  is_expired: boolean;
}

interface AddOverrideRequest {
  permission_code: string;
  effect: OverrideEffect;
  expires_at?: string; // ISO 8601
}

interface UserOverridesResponse {
  user_id: number;
  overrides: PermissionOverride[];
}

// ============= PERMISOS EFECTIVOS =============

interface UserRole {
  id_rol: number;
  rol: string;
  desc_rol: string;
  is_primary?: boolean;
}

interface EffectivePermissionsResponse {
  user_id: number;
  is_admin: boolean;
  roles: UserRole[];
  permissions: string[];
  landing_route: string | null;
  overrides: PermissionOverride[];
}

// ============= USER ROLES =============

interface AssignRolesRequest {
  role_ids: number[];
}

interface SetPrimaryRoleRequest {
  role_id: number;
}

interface AssignRolesResponse {
  message: string;
  assigned_count: number;
  user_id: number;
  role_ids: number[];
}

interface RevokeRoleResponse {
  message: string;
  user_id: number;
  role_id: number;
  reassigned_primary: boolean;
}

// ============= API ERROR =============

interface ApiError {
  code: string;
  message: string;
}
```

---

## Ejemplos de Implementacion

### Configuracion Axios

```typescript
// frontend/src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Importante para cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para CSRF token
apiClient.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_access_token='))
    ?.split('=')[1];
  
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
});

export default apiClient;
```

### Hooks TanStack Query

```typescript
// frontend/src/api/hooks/useRoles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import type { Role, CreateRoleRequest, RolesListResponse } from '../types/rbac';

export const ROLES_KEY = ['roles'] as const;

export function useRoles(includeInactive = false) {
  return useQuery({
    queryKey: [...ROLES_KEY, { includeInactive }],
    queryFn: async () => {
      const { data } = await apiClient.get<RolesListResponse>('/roles', {
        params: { include_inactive: includeInactive }
      });
      return data;
    }
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: [...ROLES_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<Role>(`/roles/${id}`);
      return data;
    },
    enabled: !!id
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: CreateRoleRequest) => {
      const { data } = await apiClient.post<Role>('/roles', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
    }
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
    }
  });
}
```

```typescript
// frontend/src/api/hooks/usePermissions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import type { 
  EffectivePermissionsResponse,
  AddOverrideRequest,
  AssignPermissionsRequest 
} from '../types/rbac';

export const PERMISSIONS_KEY = ['permissions'] as const;

export function useMyPermissions() {
  return useQuery({
    queryKey: [...PERMISSIONS_KEY, 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<EffectivePermissionsResponse>('/permissions/me');
      return data;
    }
  });
}

export function useRolePermissions(roleId: number) {
  return useQuery({
    queryKey: [...PERMISSIONS_KEY, 'role', roleId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/permissions/role/${roleId}`);
      return data;
    },
    enabled: !!roleId
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: AssignPermissionsRequest) => {
      const { data } = await apiClient.post('/permissions/assign', payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [...PERMISSIONS_KEY, 'role', variables.role_id] 
      });
    }
  });
}

export function useAddOverride(userId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: AddOverrideRequest) => {
      const { data } = await apiClient.post(
        `/permissions/users/${userId}/overrides`, 
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [...PERMISSIONS_KEY, 'user', userId] 
      });
    }
  });
}
```

---

## Checklist de Implementacion Frontend

### Modulo de Roles

- [ ] **Types:** `frontend/src/api/types/rbac.ts`
- [ ] **Resources:** `frontend/src/api/resources/roles.ts`
- [ ] **Hooks:** `frontend/src/api/hooks/useRoles.ts`
- [ ] **Componentes:**
  - [ ] `RolesTable` - Lista de roles con acciones
  - [ ] `RoleForm` - Crear/editar rol
  - [ ] `RoleDetailCard` - Detalle con permisos asignados
  - [ ] `DeleteRoleDialog` - Confirmacion de eliminacion

### Modulo de Permisos

- [ ] **Resources:** `frontend/src/api/resources/permissions.ts`
- [ ] **Hooks:** `frontend/src/api/hooks/usePermissions.ts`
- [ ] **Componentes:**
  - [ ] `PermissionsCatalog` - Lista de permisos agrupados por categoria
  - [ ] `PermissionForm` - Crear permiso custom
  - [ ] `RolePermissionsEditor` - Asignar/revocar permisos de rol
  - [ ] `PermissionTransferList` - UI de seleccion multiple

### Modulo de Overrides

- [ ] **Hooks:** `frontend/src/api/hooks/useOverrides.ts`
- [ ] **Componentes:**
  - [ ] `UserOverridesList` - Lista de overrides de usuario
  - [ ] `AddOverrideDialog` - Modal para agregar override
  - [ ] `OverrideExpirationBadge` - Badge con estado de expiracion

### Modulo de Usuarios (RBAC)

- [ ] **Hooks:** Extender `useUsers.ts` con multi-rol
- [ ] **Componentes:**
  - [ ] `UserRolesEditor` - Asignar/revocar roles
  - [ ] `PrimaryRoleSelector` - Cambiar rol primario
  - [ ] `UserPermissionsSummary` - Vista de permisos efectivos
