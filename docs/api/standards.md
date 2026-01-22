# API Standards - SIRES

> **TL;DR:** Este documento define los estándares GLOBALES que el frontend espera del backend.
> El backend DEBE cumplir con estos contratos. Estos son la FUENTE DE VERDAD.

> **Estado:** Aprobado v1.0
> **Última actualización:** 2025-01-19

---

## 🎯 Contexto

SIRES es un sistema médico crítico del Metro CDMX que maneja:
- Datos clínicos de pacientes
- Permisos y roles de usuarios
- Historial médico
- Recetas y prescripciones

**Características:**
- **CRÍTICO en seguridad:** Datos de salud (ePHI) bajo regulaciones HIPAA
- **CRÍTICO en disponibilidad:** Sistema en producción 24/7
- **ENORME en escala:** Múltiples módulos médicos, cientos de endpoints
- **Multi-tenant:** Múltiples clínicas y roles

---

## 📏 Estándar 1: Nomenclatura

### Regla General

| Capa | Formato | Idioma | Ejemplo | Justificación |
|------|---------|--------|---------|---------------|
| **Frontend (Types, UI)** | camelCase | Inglés | `fullName`, `email`, `isActive` | Idiomático JS/TS, industria global |
| **Backend (API responses)** | camelCase | Inglés | `fullName`, `email`, `isActive` | Match con frontend, sin adapters |
| **Base de Datos** | snake_case | Español | `nombre_completo`, `correo`, `est_activo` | MySQL legacy, adapters en backend |

### Mapeo BD → API (Backend hace la conversión)

| Base de Datos (snake_case español) | API/Frontend (camelCase inglés) |
|------------------------------------|---------------------------------|
| `id_usuario` | `id` |
| `nombre` | `firstName` |
| `paterno` | `paternalName` |
| `materno` | `maternalName` |
| `nombre_completo` (calculado) | `fullName` |
| `usuario` | `username` |
| `correo` | `email` |
| `clave` | (nunca expuesto) |
| `id_clin` | `clinicId` o `clinic: { id, name }` |
| `est_usuario` | `isActive` |
| `fch_alta` | `createdAt` |
| `usr_alta` | `createdBy` |
| `fch_modf` | `updatedAt` |
| `usr_modf` | `updatedBy` |
| `cambiar_clave` | `mustChangePassword` |
| `terminos_acept` | `termsAccepted` |
| `last_conexion` | `lastLoginAt` |
| `ip_ultima` | `lastIp` |

### Reglas Específicas

1. **IDs:** Siempre `id` genérico (no `userId`, `roleId`)
   ```typescript
   // ✅ Correcto
   interface User { id: number; ... }
   
   // ❌ Incorrecto
   interface User { userId: number; ... }
   ```

2. **Relaciones:** Objeto anidado (no ID + Name separados)
   ```typescript
   // ✅ Correcto - Objeto anidado
   interface UserListItem {
     clinic: { id: number; name: string } | null;
   }
   
   // ❌ Incorrecto - Campos separados
   interface UserListItem {
     clinicId: number | null;
     clinicName: string | null;
   }
   ```

3. **Booleanos:** Prefijo `is`, `has`, `must`, `can`
   ```typescript
   // ✅ Correcto
   isActive, isExpired, mustChangePassword, hasPermission
   
   // ❌ Incorrecto
   active, expired, changePassword, permission
   ```

4. **Fechas:** Sufijo `At` para timestamps
   ```typescript
   // ✅ Correcto
   createdAt, updatedAt, lastLoginAt, expiresAt, assignedAt
   
   // ❌ Incorrecto
   createdDate, updateTime, lastLogin, expiration
   ```

5. **Auditoría:** Sufijo `By` para usuarios
   ```typescript
   // ✅ Correcto (objeto anidado)
   createdBy: { id: number; name: string }
   assignedBy: { id: number; name: string }
   
   // ❌ Incorrecto (solo ID o solo nombre)
   createdById: number
   createdByName: string
   ```

---

## 📦 Estándar 2: Estructura de Responses

### A. Listados Paginados

```typescript
interface ListResponse<T> {
  items: T[];          // Array de datos
  page: number;        // Página actual (1-based, NO 0-based)
  pageSize: number;    // Items por página (default: 20, max: 100)
  total: number;       // Total de items en BD
  totalPages: number;  // Total de páginas
}
```

### B. Entidad Singular

```typescript
// Objeto plano directo (SIN wrapper)
{
  "id": 123,
  "username": "jperez",
  "fullName": "Juan Pérez García",
  "email": "jperez@metro.cdmx.gob.mx"
}
```

### C. Entidad con Sub-recursos

```typescript
// Para detalle completo (GET /users/:id)
interface UserDetailResponse {
  user: UserDetail;       // Entidad principal
  roles: UserRole[];      // Sub-recursos relacionados
  overrides: UserOverride[];
}
```

### D. Void Responses (Acciones sin retorno)

```typescript
interface SuccessResponse {
  success: boolean;   // Siempre true si llegó aquí
  message?: string;   // Mensaje opcional para UI
}
```

---

## 🚨 Estándar 3: Códigos de Error

### Estructura del Error

```typescript
interface ApiError {
  code: string;                       // Código descriptivo (NO HTTP status)
  message: string;                    // Mensaje user-friendly
  status: number;                     // HTTP status code
  details?: Record<string, string[]>; // Errores por campo (forms)
  requestId?: string;                 // Request ID para traceability
  timestamp?: string;                 // ISO 8601 timestamp
}
```

### Códigos de Error Definidos

#### Auth Errors (4xx)
| Código | HTTP | Descripción |
|--------|------|-------------|
| `INVALID_CREDENTIALS` | 400 | Usuario o contraseña incorrectos |
| `TOKEN_EXPIRED` | 401 | Access token expirado |
| `TOKEN_INVALID` | 401 | Token malformado o inválido |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token expirado (relogin) |
| `SESSION_EXPIRED` | 401 | Sesión terminada por inactividad |
| `PERMISSION_DENIED` | 403 | Sin permiso para este recurso |
| `ACCOUNT_LOCKED` | 423 | Cuenta bloqueada por intentos fallidos |

#### Validation Errors (400)
| Código | Descripción |
|--------|-------------|
| `VALIDATION_ERROR` | Error genérico de validación |
| `FIELD_REQUIRED` | Campo requerido faltante |
| `INVALID_FORMAT` | Formato inválido |
| `INVALID_EMAIL` | Email mal formado |
| `PASSWORD_TOO_WEAK` | Contraseña no cumple requisitos |

#### Business Logic Errors (4xx)
| Código | HTTP | Descripción |
|--------|------|-------------|
| `USER_EXISTS` | 409 | Usuario/email ya existe |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado |
| `ROLE_NOT_FOUND` | 404 | Rol no encontrado |
| `PERMISSION_NOT_FOUND` | 404 | Permiso no encontrado |
| `CLINIC_NOT_FOUND` | 404 | Clínica no encontrada |
| `CANNOT_DELETE_SYSTEM_ROLE` | 400 | Rol de sistema no eliminable |
| `CANNOT_REMOVE_LAST_ROLE` | 400 | Usuario debe tener al menos un rol |

#### System Errors (5xx)
| Código | HTTP | Descripción |
|--------|------|-------------|
| `INTERNAL_SERVER_ERROR` | 500 | Error interno del servidor |
| `DATABASE_ERROR` | 500 | Error de base de datos |
| `EXTERNAL_SERVICE_ERROR` | 502 | Error en servicio externo |

#### Network Errors (Client-side)
| Código | Descripción |
|--------|-------------|
| `NETWORK_ERROR` | Sin conexión a internet |
| `TIMEOUT_ERROR` | Request timeout |
| `RATE_LIMIT_EXCEEDED` | Demasiadas requests (429) |

---

## 📢 Estándar 4: Manejo de Mensajes (Toast/Feedback)

### Regla Principal

| Tipo de Response | ¿Incluye `message`? | ¿Quién genera el feedback? |
|------------------|---------------------|---------------------------|
| **Error (4xx/5xx)** | ✅ SÍ - Backend | Frontend usa `error.message` |
| **Éxito (2xx)** | ❌ NO - Solo datos | Frontend genera el mensaje |
| **Void (204)** | ⚪ Opcional (`SuccessResponse`) | Frontend puede usarlo o ignorarlo |

### Justificación

1. **Separación de responsabilidades**: Backend = datos, Frontend = presentación
2. **Internacionalización (i18n)**: Frontend controla el idioma de los mensajes
3. **Contexto de UI**: Frontend sabe si es modal, wizard, página completa
4. **Consistencia UX**: El equipo de diseño controla voz y tono

### Ejemplos

#### Backend: Solo devuelve datos

```python
# Éxito - 200 OK (sin message)
return jsonify({
    "user": { "id": 1, "fullName": "Juan Pérez", ... }
}), 200

# Error - 409 Conflict (con message)
return jsonify({
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "El correo juan@example.com ya está en uso"
}), 409
```

#### Frontend: Genera mensajes de éxito, usa mensajes de error

```typescript
try {
  const result = await usersApi.update(id, data);
  // Éxito - Frontend genera el mensaje
  toast.success(`Usuario ${result.user.fullName} actualizado`);
  
} catch (error) {
  // Error - Backend provee el mensaje
  if (error instanceof ApiError) {
    toast.error(error.message);
  }
}
```

### Tipos Afectados

**Responses de éxito NO incluyen `message`:**
- `UpdateUserResponse` → `{ user: UserListItem }`
- `CreateUserResponse` → `{ id, username, temporaryPassword }`
- `UpdateRoleResponse` → `{ role: Role }`
- `AssignPermissionsResponse` → `{ roleId, assignedCount, permissionIds }`

**Responses que SÍ incluyen `message`:**
- `ErrorResponse` → Para todos los errores
- `SuccessResponse` → Para operaciones void (message opcional)

---

## 📄 Estándar 5: Paginación

```typescript
interface PaginationParams {
  page?: number;              // Página actual (default: 1, 1-based)
  pageSize?: number;          // Items por página (default: 20, max: 100)
  search?: string;            // Búsqueda libre (opcional)
  sortBy?: string;            // Campo por el cual ordenar
  sortOrder?: 'asc' | 'desc'; // Dirección de ordenamiento
}
```

**Reglas:**
- `page` es **1-based** (NO 0-based)
- `pageSize` default: 20, máximo: 100
- Búsqueda es case-insensitive y busca en campos relevantes
- `sortBy` usa nombres de campos del API (camelCase inglés)

---

## 📅 Estándar 6: Fechas

**Formato:** ISO 8601 en UTC

```json
"2025-01-19T14:30:00Z"
```

**Reglas:**
- Backend **SIEMPRE** envía UTC
- Frontend convierte a timezone local para mostrar
- Requests al backend pueden enviar cualquier timezone (backend normaliza)

---

## 🔒 Estándar 7: Seguridad

### 7.1 Request ID (OBLIGATORIO)

Todo request debe incluir:
```http
X-Request-ID: "550e8400-e29b-41d4-a716-446655440000"
```

El frontend lo genera automáticamente en el interceptor.

### 7.2 CSRF Token (OBLIGATORIO para mutaciones)

Requests que modifican datos (POST, PUT, PATCH, DELETE) deben incluir:
```http
X-CSRF-TOKEN: "token-from-csrf-cookie"
```

### 7.3 JWT en Cookies HttpOnly

- Access token: Cookie `access_token_cookie` (HttpOnly, Secure, SameSite=Lax)
- Refresh token: Cookie `refresh_token_cookie` (HttpOnly, Secure, SameSite=Strict)
- **NUNCA** en localStorage/sessionStorage
- **NUNCA** en body de response

### 7.4 Rate Limiting Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1737050000
```

### 7.5 Retry Logic

- Reintentar solo en: 5xx, network errors, 429
- Exponential backoff: 1s, 2s, 4s (máximo 3 intentos)
- NO reintentar: 4xx (excepto 429)

### 7.6 Timeouts

- Default: 30 segundos
- Auth endpoints: 10 segundos
- File uploads: 120 segundos

---

## 📊 Estándar 8: Tipos por Contexto

Cada entidad tiene diferentes "vistas" según el contexto de uso:

| Contexto | Tipo | Datos | Ejemplo |
|----------|------|-------|---------|
| **Sesión** | `AuthUser` | Mínimo para navegación | `id`, `username`, `fullName`, `roles`, `permissions` |
| **Lista** | `*ListItem` | Para mostrar en tabla | `id`, `username`, `fullName`, `email`, `clinic`, `isActive` |
| **Detalle** | `*Detail` | Para página de edición | Todo lo anterior + auditoría + datos editables |
| **Referencia** | `*Ref` | Objeto anidado en relaciones | `{ id, name }` |

Esto evita:
- Sobrecargar responses con datos innecesarios
- Múltiples requests para obtener lo que necesitás
- Confusión sobre qué campos están disponibles en cada contexto

---

## 🚀 Estándar 9: Estrategia de Cache (TanStack Query)

### 9.1 Principios

El frontend usa **TanStack Query (React Query)** para gestionar el cache de datos. La estrategia de cache se define por TIPO de operación:

| Tipo de Operación | Response | Cache Strategy | ¿Por qué? |
|-------------------|----------|-----------------|-----------|
| **Crear (POST)** | Minimalista: `{id, name}` | **Invalidar** query de listado | El backend no devuelve datos completos, es más simple invalidar |
| **Actualizar datos (PUT/PATCH)** | Recurso completo | **Invalidar** query de detalle + listado | Evita sync incompleto de múltiples queries con diferentes filtros |
| **Eliminar (DELETE)** | `SuccessResponse` vacío | **Invalidar** query de listado | Ya no existe el recurso |
| **Sub-recursos** (roles, overrides, permissions) | `{parentId, lista[]}` | **Sync optimista** + respuesta | Sub-recursos son independientes, backend devuelve lista actualizada |

### 9.2 Cuándo Invalidar vs Sync

#### Invalidar (usar cuando:)

- La operación afecta el recurso principal (datos básicos)
- La response no tiene todos los datos necesarios para sync
- Hay múltiples listados con diferentes filtros/ordenamientos
- La simplicidad es más importante que la velocidad

```typescript
// Ejemplo: Crear rol
const result = await rolesApi.create(data);
queryClient.invalidateQueries(['roles']);  // Re-fetch automático del listado

// Ejemplo: Actualizar rol (datos principales)
const result = await rolesApi.update(roleId, data);
queryClient.invalidateQueries(['roles', roleId]);  // Re-fetch del detalle
queryClient.invalidateQueries(['roles']);        // Re-fetch del listado
```

#### Sync (usar cuando:)

- La operación afecta solo un sub-recurso (roles, overrides, permissions)
- El backend devuelve la lista completa actualizada del sub-recurso
- Es una lista anidada en el recurso principal

```typescript
// Ejemplo: Asignar permisos a rol
// Backend devuelve: { roleId: 5, permissions: [...] }

// 1. Optimistic update (UI inmediato)
queryClient.setQueryData(['roles', roleId], (old) => ({
  ...old,
  permissions: optimisticPermissions
}));

// 2. Llamada a API
const result = await rolesApi.assignPermissions(roleId, permissionIds);

// 3. Sync con respuesta del servidor
queryClient.setQueryData(['roles', roleId], (old) => ({
  ...old,
  permissions: result.permissions  // Lista completa actualizada
}));
```

### 9.3 Ejemplos por Recurso

#### Usuarios

| Operación | Response | Cache Strategy |
|-----------|----------|----------------|
| `POST /api/v1/users` | `{id, username, temporaryPassword}` | Invalidar `['users']` |
| `PATCH /api/v1/users/:id` | `{user: UserListItem}` | Invalidar `['users', id]` + `['users']` |
| `DELETE /api/v1/users/:id` | `SuccessResponse` | Invalidar `['users']` |
| `POST /api/v1/users/:id/roles` | `{userId, roles[]}` | Sync de `['users', id].roles` |
| `PUT /api/v1/users/:id/roles/primary` | `{userId, roles[]}` | Sync de `['users', id].roles` |
| `DELETE /api/v1/users/:id/roles/:roleId` | `{userId, roles[]}` | Sync de `['users', id].roles` |
| `POST /api/v1/users/:id/overrides` | `{userId, overrides[]}` | Sync de `['users', id].overrides` |
| `DELETE /api/v1/users/:id/overrides/:code` | `{userId, overrides[]}` | Sync de `['users', id].overrides` |

#### Roles

| Operación | Response | Cache Strategy |
|-----------|----------|----------------|
| `POST /api/v1/roles` | `{id, name}` | Invalidar `['roles']` |
| `PUT /api/v1/roles/:id` | `{role: RoleDetail}` | Invalidar `['roles', id]` + `['roles']` |
| `DELETE /api/v1/roles/:id` | `SuccessResponse` | Invalidar `['roles']` |
| `POST /api/v1/roles/:id/permissions` | `{roleId, permissions[]}` | Sync de `['roles', id].permissions` |
| `DELETE /api/v1/roles/:id/permissions` | `{roleId, permissions[]}` | Sync de `['roles', id].permissions` |

### 9.4 Patrón Completo de Sync Optimista

```typescript
const queryClient = useQueryClient();
const [isMutating, setIsMutating] = useState(false);

const assignPermissions = async (roleId: number, permissionIds: number[]) => {
  // 1. Guardar estado anterior (para rollback)
  const previousData = queryClient.getQueryData(['roles', roleId]);
  
  try {
    setIsMutating(true);
    
    // 2. Optimistic update (UI inmediato)
    queryClient.setQueryData(['roles', roleId], (old) => ({
      ...old,
      permissions: [
        ...old.permissions,
        ...permissionIds.map(id => ({ id, code: '...', description: '...' }))
      ]
    }));
    
    // 3. Llamada a API
    const result = await rolesApi.assignPermissions(roleId, permissionIds);
    
    // 4. Sync con respuesta del servidor (datos reales)
    queryClient.setQueryData(['roles', roleId], (old) => ({
      ...old,
      permissions: result.permissions  // Lista completa actualizada
    }));
    
    return result;
    
  } catch (error) {
    // 5. Rollback en caso de error
    queryClient.setQueryData(['roles', roleId], previousData);
    throw error;
  } finally {
    setIsMutating(false);
  }
};
```

### 9.5 Reglas de Oro

1. **Para crear/actualizar/eliminar datos principales** → Invalidar
2. **Para sub-recursos (listas anidadas)** → Sync optimista + respuesta
3. **Siempre guardar el estado anterior** para hacer rollback en caso de error
4. **Usar `setQueryData` solo cuando tengas certeza** de los datos completos
5. **Para operaciones críticas** (ej: permisos), siempre sync con respuesta del servidor
