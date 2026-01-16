# Backend Migration Guide - SIRES API

> **TL;DR:** Este documento define los contratos que el frontend espera del backend de SIRES.
> El backend DEBE cumplir con estos contratos. El frontend define la FUENTE DE VERDAD.

> **Estado:** Contract-First Development
> **Última actualización:** 2025-01-16

---

## 🎯 Contexto

SIRES está pasando por una refactorización completa donde el **fronten define los estándares** y el backend debe adaptarse para cumplirlos.

### Principios

1. **Frontend como Fuente de Verdad:** Los Zod schemas definen el contrato que el backend DEBE cumplir.
2. **CamelCase en API/Frontend:** Todos los campos de API usan camelCase.
3. **Snake_case en Base de Datos:** Los campos de BD siguen snake_case (MySQL estándar).
4. **IDs Simplificados:** En API, todos usan `id` genérico (no `idUsuario`, `idRol`, etc.)
5. **Backend hace adaptación:** El backend convierte de snake_case (DB) a camelCase (API).

---

## 📏 Estándar 1: Nomenclatura

### Regla General

| Capa | Formato | Ejemplo | Justificación |
|------|----------|-----------|---------------|
| **Frontend (Types, UI)** | camelCase | `idUsuario`, `nombreCompleto` | Idiomático JavaScript/TypeScript, estándar de la industria |
| **Backend (API)** | camelCase | `idUsuario`, `nombreCompleto` | Machea frontend sin adapters, simplifica integración |
| **Base de Datos** | snake_case | `id_usuario`, `nombre_completo` | MySQL estándar, adapters en backend |

### Conversiones BD → API

#### Users

| Campo BD | Campo API |
|----------|----------|
| `id_usuario` | `id` |
| `usuario` | `usuario` |
| `nombre` | `nombre` |
| `paterno` | `paterno` |
| `materno` | `materno` |
| `expediente` | `expediente` |
| `id_clin` | `idClinica` |
| `correo` | `correo` |
| `rol_primario` | `rolPrimario` |
| `is_active` | `isActive` |
| `last_conexion` | `ultimaConexion` |
| `terminos_acept` | `terminosAcept` |
| `cambiar_clave` | `cambiarClave` |
| `ip_ultima` | `ipUltima` |
| `created_at` | `createdAt` |
| `created_by` | `creadoPor` |
| `updated_at` | `updatedAt` |
| `updated_by` | `actualizadoPor` |

#### Roles

| Campo BD | Campo API |
|----------|----------|
| `id_rol` | `id` |
| `rol` | `nombre` |
| `desc_rol` | `descripcion` |
| `is_active` | `isActive` |
| `is_system` | `isSystem` |
| `landing_route` | `landingRoute` |
| `created_at` | `createdAt` |
| `created_by` | `creadoPor` |
| `updated_at` | `updatedAt` |
| `updated_by` | `actualizadoPor` |

#### Permissions

| Campo BD | Campo API |
|----------|----------|
| `id_permission` | `id` |
| `code` | `codigo` |
| `description` | `descripcion` |

#### Permissions Override (User Permission Overrides)

| Campo BD | Campo API |
|----------|----------|
| `id_user_permission_override` | `id` |
| `permission_code` | `codigoPermiso` |
| `permission_description` | `descripcionPermiso` |
| `expires_at` | `expiraEn` |
| `assigned_at` | `asignadoEn` |
| `assigned_by` | `asignadoPor` |

#### Clinicas

| Campo BD | Campo API |
|----------|----------|
| `id_clin` | `id` |
| `clinica` | `nombre` |
| `folio_clin` | `folio` |

#### Auth User (Base de Usuarios)

Los mismos que Users.

---

## 📦 Estándar 2: Estructura de Responses

### A. Listados Paginados

**Usado en:** Tablas, grids, listas con más de 20 items.

```json
{
  "items": [/* datos paginados */],
  "page": 1,
  "pageSize": 20,
  "total": 150,
  "totalPages": 8
}
```

### B. Entidad Singular (Sin paginación)

**Usado en:** Detalle, operaciones singulares, endpoints que retornan UN solo objeto.

```json
{
  "id": 123,
  "usuario": "jdoe",
  "nombre": "Juan",
  // ... más campos
}
```

### C. Void Responses (Acciones sin retorno de datos)

**Usado en:** Activar/Desactivar, Logout, Delete, Assign roles, etc.

```json
{
  "success": true,
  "message": "Usuario activado exitosamente"
}
```

### D. Response Wrapper (para contratos con datos relacionados)

**Usado en:** Detalle con data relacionada (ej: UserDetail con roles y overrides).

```json
{
  "user": { /* User object completo */ },
  "roles": [/* array de roles asignados */],
  "overrides": [/* array de overrides */]
}
```

---

## 🚨 Estándar 3: Códigos de Error

### Estructura del Error

```json
{
  "code": "USER_NOT_FOUND",
  "message": "El usuario no existe",
  "status": 404,
  "details": {
    "correo": ["El correo ya está registrado"]
  },
  "requestId": "550e8400-e29b-41d4-a716-4466554400000",
  "timestamp": "2025-01-16T14:30:00Z"
}
```

### Códigos de Error Definidos

#### Auth Errors (4xx)

| Código | HTTP | Descripción | Mensaje Sugerido |
|--------|-------|-------------|-------------------|
| `INVALID_CREDENTIALS` | 400 | Credenciales inválidas | "Usuario o contraseña incorrectos" |
| `TOKEN_EXPIRED` | 401 | Token de acceso expiró | "Tu sesión ha expirado, inicia sesión nuevamente" |
| `TOKEN_INVALID` | 401 | Token inválido o malformado | "Token inválido, inicia sesión nuevamente" |
| `SESSION_EXPIRED` | 401 | Sesión del usuario expiró | "Tu sesión ha expirado" |
| `PERMISSION_DENIED` | 403 | No tiene permiso | "No tienes permiso para realizar esta acción" |

#### Validation Errors (400)

| Código | HTTP | Descripción | Ejemplo |
|--------|-------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Error genérico de validación | Múltiples campos inválidos |
| `FIELD_REQUIRED` | 400 | Campo requerido faltante | "El correo electrónico es requerido" |
| `INVALID_FORMAT` | 400 | Formato de campo inválido | "El formato no es válido" |
| `INVALID_EMAIL` | 400 | Email inválido | "El correo electrónico no es válido" |
| `INVALID_PASSWORD` | 400 | Password no cumple requisitos | "La contraseña debe tener al menos 8 caracteres" |
| `INVALID_PHONE` | 400 | Teléfono inválido | "El teléfono no es válido" |
| `INVALID_DATE` | 400 | Fecha inválida | "La fecha no es válida" |

#### Business Logic Errors (4xx)

| Código | HTTP | Descripción | Mensaje Sugerido |
|--------|-------|-------------|-------------------|
| `USER_EXISTS` | 409 | El usuario ya existe | "Ya existe un usuario con este correo o expediente" |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado | "El usuario no existe" |
| `ROLE_NOT_FOUND` | 404 | Rol no encontrado | "El rol no existe" |
| `PERMISSION_NOT_FOUND` | 404 | Permiso no encontrado | "El permiso no existe" |
| `CLINIC_NOT_FOUND` | 404 | Clínica no encontrada | "La clínica no existe" |
| `USER_ALREADY_ACTIVE` | 409 | Usuario ya está activo | "El usuario ya está activo" |
| `USER_ALREADY_INACTIVE` | 409 | Usuario ya está inactivo | "El usuario ya está inactivo" |
| `CANNOT_DELETE_SYSTEM_ROLE` | 403 | No se puede eliminar rol de sistema | "No se puede eliminar roles de sistema" |
| `CANNOT_DELETE_ROLE_WITH_USERS` | 409 | No se puede eliminar rol con usuarios | "El rol tiene usuarios asignados, no se puede eliminar" |

#### System Errors (5xx)

| Código | HTTP | Descripción | Mensaje Sugerido |
|--------|-------|-------------|-------------------|
| `INTERNAL_SERVER_ERROR` | 500 | Error interno del servidor | "Ocurrió un error inesperado, intenta nuevamente" |
| `DATABASE_ERROR` | 500 | Error de base de datos | "Error al acceder a la base de datos, intenta nuevamente" |
| `EXTERNAL_SERVICE_ERROR` | 502 | Error de servicio externo | "Error al conectar con servicio externo" |

#### Network Errors

| Código | HTTP | Descripción | Mensaje Sugerido |
|--------|-------|-------------|-------------------|
| `NETWORK_ERROR` | 0 | No hay conexión a internet | "No hay conexión a internet" |
| `TIMEOUT_ERROR` | 0 | La petición excedió el tiempo límite | "La petición tardó demasiado tiempo, intenta nuevamente" |
| `RATE_LIMIT_EXCEEDED` | 429 | Se excedió el límite de peticiones | "Has excedido el límite de peticiones, espera unos minutos" |

---

## 📄 Estándar 4: Paginación

### Params

```json
{
  "page": 1,
  "pageSize": 20,
  "search": "juan",
  "sortBy": "nombre",
  "sortOrder": "asc"
}
```

### Reglas

1. **`page` es 1-based:** La primera página es 1, NO 0.
2. **`pageSize` default:** 20
3. **`pageSize` máximo:** 100
4. **Búsqueda (`search`):** Libre texto, case-insensitive
5. **Ordenamiento (`sortBy`, `sortOrder`):**
   - `sortBy`: Nombre del campo (`nombre`, `fechaCreacion`, etc.)
   - `sortOrder`: `asc` (ascendente) o `desc` (descendente)

---

## 📅 Estándar 5: Fechas

### Formato

- **Backend (UTC):** `"2025-01-16T14:30:00Z"`
- **Frontend (Timezone usuario):** `"2025-01-16T08:30:00-06:00"` (Mexico City, UTC-6)

### Reglas

1. **Backend SIEMPRE UTC:** Todas las fechas se guardan en UTC.
2. **Frontend convierte:** Usa `Intl.DateTimeFormat` o `date-fns-tz` para mostrar en timezone del usuario.
3. **Frontend envía:** Convierte de timezone local a UTC antes de enviar al backend.

---

## 🔑 Estándar 6: Seguridad

### 6.1 Request ID (OBLIGATORIO)

**Propósito:** Traceability en sistemas médicos críticos.

```json
Header: {
  "X-Request-ID": "550e8400-e29b-41d4-a716-4466554400000"
}
```

**Implementación en frontend:**
```typescript
const requestId = crypto.randomUUID();
config.headers['X-Request-ID'] = requestId;
```

**Backend DEBE:**
- Retornar el `X-Request-ID` recibido en la response
- Usar este ID para loggear todos los requests

### 6.2 Audit Logs (OBLIGATORIO)

**Qué loggear:**

- Cada request que acceda a datos de pacientes (ePHI)
- Quién hizo el request (`user_id`)
- Qué endpoint se llamó
- Cuándo ocurrió (`timestamp`)
- Resultado (`success` o `error`)
- IP de origen

**Retención:** Mínimo 6 años (HIPAA requirement)

### 6.3 Rate Limiting

**Headers en response:**

```json
{
  "X-RateLimit-Limit": 100,
  "X-RateLimit-Remaining": 95,
  "X-RateLimit-Reset": 1737050000
}
```

**Frontend maneja:**
- Detectar 429 Too Many Requests
- Esperar `X-RateLimit-Reset - ahora` segundos antes de reintentar
- Mostrar mensaje al usuario

### 6.4 Retry Logic

**Reintentar SOLO en:**
- 5xx errors (Server errors)
- Network errors (sin conexión)
- 429 Rate Limit Exceeded

**NO reintentar en:**
- 4xx client errors (excepto 401 con refresh token)
- 404 Not Found
- 403 Forbidden

**Exponential Backoff:**
```
Intento 1: Reintentar inmediatamente
Intento 2: Esperar 1 segundo
Intento 3: Esperar 2 segundos
Máximo: 3 intentos
```

### 6.5 Timeout

**Default:** 30 segundos

**Configurable por endpoint (opcional):**
```typescript
apiClient.post('/endpoint-slow', data, {
  timeout: 60000  // 60 segundos
});
```

### 6.6 Encryption

**En reposo (Data at rest):**
- AES-256 para datos de pacientes
- Keys rotadas cada 90 días

**En tránsito (Data in transit):**
- TLS 1.2+ obligatorio
- HTTPS obligatorio (NO HTTP)

---

## 🔎 Estándar 7: IDs

### Regla

**TODAS las entidades usan `id` genérico en API/Frontend:**

| Entidad | ID BD → ID API | Ejemplo |
|----------|---------------|---------|
| User | `id_usuario` → `id` | `{ "id": 123, "usuario": "jdoe" }` |
| Role | `id_rol` → `id` | `{ "id": 5, "nombre": "MEDICO" }` |
| Permission | `id_permission` → `id` | `{ "id": 42, "codigo": "expedientes:read" }` |
| Clinic | `id_clin` → `id` | `{ "id": 1, "nombre": "CUAUHTÉMOC" }` |

---

## 🚀 Endpoints a Implementar

### Auth API

#### POST /api/v1/auth/login

**Request:**
```json
{
  "usuario": "jdoe",
  "clave": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 123,
    "usuario": "jdoe",
    "nombre": "Juan",
    "paterno": "Doe",
    "materno": "García",
    "correo": "juan@example.com",
    "expediente": "MED2025001",
    "idClinica": 1,
    "rolPrimario": "MEDICO",
    "isActive": true,
    "ultimaConexion": null,
    "roles": ["MEDICO", "ADMIN"],
    "permissions": ["expedientes:read", "expedientes:write"],
    "landingRoute": "/dashboard",
    "mustChangePassword": false
  },
  "requiresOnboarding": false
}
```

**Error (400):**
```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Usuario o contraseña incorrectos",
  "status": 400
}
```

#### POST /api/v1/auth/logout

**Response (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

#### GET /api/v1/auth/me

**Response (200):**
```json
{
  "id": 123,
  "usuario": "jdoe",
  "nombre": "Juan",
  // ... mismos campos que LoginResponse.user
}
```

#### GET /api/v1/auth/verify

**Response (200):**
```json
{
  "valid": true
}
```

#### POST /api/v1/auth/refresh

**Request:**
```json
{}
```
**Response (200):**
```json
{
  "code": "TOKEN_REFRESHED",
  "message": "Token renovado exitosamente"
}
```

**Error (401):**
```json
{
  "code": "TOKEN_EXPIRED",
  "message": "La sesión ha expirado",
  "status": 401
}
```

#### POST /api/v1/auth/request-reset-code

**Request:**
```json
{
  "correo": "juan@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Código de recuperación enviado a tu correo electrónico"
}
```

#### POST /api/v1/auth/verify-reset-code

**Request:**
```json
{
  "correo": "juan@example.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "valid": true,
  "token": "temp_token_xyz"
}
```

#### POST /api/v1/auth/reset-password

**Request:**
```json
{
  "newPassword": "NuevoPassword123"
}
```

**Response (200):**
```json
{
  "user": { /* mismo que LoginResponse.user */ },
  "requiresOnboarding": false
}
```

#### POST /api/v1/auth/complete-onboarding

**Request:**
```json
{
  "newPassword": "NuevoPassword123",
  "termsAccepted": true
}
```

**Response (200):**
```json
{
  "user": { /* mismo que LoginResponse.user */ },
  "requiresOnboarding": false
}
```

### Users API

#### GET /api/v1/users

**Params:**
```
?page=1&pageSize=20&search=juan&isActive=true&roleId=5
```

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "usuario": "jdoe",
      "nombre": "Juan",
      "paterno": "Doe",
      "materno": "García",
      "correo": "juan@example.com",
      "expediente": "MED2025001",
      "idClinica": 1,
      "rolPrimario": "MEDICO",
      "isActive": true,
      "ultimaConexion": "2025-01-16T14:30:00Z"
    }
    // ... más usuarios
  ],
  "page": 1,
  "pageSize": 20,
  "total": 150,
  "totalPages": 8
}
```

#### POST /api/v1/users

**Request:**
```json
{
  "usuario": "jdoe2",
  "expediente": "MED2025002",
  "nombre": "María",
  "paterno": "Gómez",
  "materno": "López",
  "correo": "maria@example.com",
  "idClinica": 1,
  "rolPrimario": 5
}
```

**Response (201):**
```json
{
  "id": 124,
  "usuario": "jdoe2",
  "tempPassword": "TempPass123"
}
```

**Error (409):**
```json
{
  "code": "USER_EXISTS",
  "message": "Ya existe un usuario con este correo o expediente",
  "status": 409
}
```

#### GET /api/v1/users/:id

**Response (200):**
```json
{
  "user": {
    "id": 123,
    "usuario": "jdoe",
    "nombre": "Juan",
    "paterno": "Doe",
    "materno": "García",
    "correo": "juan@example.com",
    "expediente": "MED2025001",
    "idClinica": 1,
    "rolPrimario": "MEDICO",
    "isActive": true,
    "ultimaConexion": "2025-01-16T14:30:00Z",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-16T14:30:00Z",
    "creadoPor": 1,
    "actualizadoPor": 5,
    "terminosAcept": true,
    "cambiarClave": false,
    "ipUltima": "192.168.1.100"
  },
  "roles": [
    {
      "id": 1,
      "nombre": "MEDICO",
      "descripcion": "Médico de planta",
      "isPrimary": true,
      "asignadoEn": "2025-01-10T10:00:00Z",
      "asignadoPor": "admin"
    }
    // ... más roles
  ],
  "overrides": [
    {
      "id": 1,
      "codigoPermiso": "expedientes:delete",
      "descripcionPermiso": "Puede eliminar expedientes",
      "effect": "DENY",
      "expiraEn": "2025-12-31T23:59:59Z",
      "expirado": false,
      "asignadoEn": "2025-01-15T14:30:00Z",
      "asignadoPor": "admin"
    }
  ]
}
```

#### PATCH /api/v1/users/:id

**Request:**
```json
{
  "nombre": "Juan Carlos",
  "correo": "juancarlos@example.com"
}
```

**Response (200):**
```json
{
  "message": "Usuario actualizado exitosamente",
  "user": { /* User object completo */ }
}
```

#### PATCH /api/v1/users/:id/activate

**Response (200):**
```json
{
  "message": "Usuario activado exitosamente",
  "user": { /* User object con isActive: true */ }
}
```

#### PATCH /api/v1/users/:id/deactivate

**Response (200):**
```json
{
  "message": "Usuario desactivado exitosamente",
  "user": { /* User object con isActive: false */ }
}
```

### Users API - Sub-recurso Roles

#### GET /api/v1/users/:id/roles

**Response (200):**
```json
{
  "userId": 123,
  "roles": [
    {
      "id": 1,
      "nombre": "MEDICO",
      "descripcion": "Médico de planta",
      "isPrimary": true,
      "asignadoEn": "2025-01-10T10:00:00Z",
      "asignadoPor": "admin"
    }
  ]
}
```

#### POST /api/v1/users/:id/roles

**Request:**
```json
{
  "roleIds": [1, 5, 10]
}
```

**Response (200):**
```json
{
  "message": "Roles asignados exitosamente",
  "userId": 123,
  "assignedCount": 3,
  "roleIds": [1, 5, 10]
}
```

#### PUT /api/v1/users/:id/roles/primary

**Request:**
```json
{
  "roleId": 5
}
```

**Response (200):**
```json
{
  "message": "Rol primario establecido exitosamente",
  "userId": 123,
  "roleId": 5
}
```

#### DELETE /api/v1/users/:id/roles/:roleId

**Response (200):**
```json
{
  "message": "Rol revocado exitosamente",
  "userId": 123,
  "revokedRoleId": 10
}
```

### Users API - Sub-recurso Overrides

#### GET /api/v1/users/:id/overrides

**Response (200):**
```json
{
  "userId": 123,
  "overrides": [
    {
      "id": 1,
      "codigoPermiso": "expedientes:delete",
      "descripcionPermiso": "Puede eliminar expedientes",
      "effect": "DENY",
      "expiraEn": "2025-12-31T23:59:59Z",
      "expirado": false,
      "asignadoEn": "2025-01-15T14:30:00Z",
      "asignadoPor": "admin"
    }
  ]
}
```

#### POST /api/v1/users/:id/overrides

**Request:**
```json
{
  "permissionCode": "expedientes:delete",
  "effect": "DENY",
  "expiraEn": "2025-12-31T23:59:59Z"
}
```

**Response (200):**
```json
{
  "message": "Override de permiso agregado exitosamente",
  "userId": 123,
  "permissionCode": "expedientes:delete",
  "effect": "DENY"
}
```

#### DELETE /api/v1/users/:id/overrides/:permissionCode

**Response (200):**
```json
{
  "success": true,
  "message": "Override eliminado exitosamente"
}
```

### Roles API

#### GET /api/v1/roles

**Params:**
```
?page=1&pageSize=20&search=medico&isActive=true
```

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "nombre": "MEDICO",
      "descripcion": "Médico de planta",
      "isActive": true,
      "isSystem": false,
      "landingRoute": "/dashboard",
      "permissionsCount": 15,
      "usersCount": 42,
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": null,
      "creadoPor": "admin"
    }
    // ... más roles
  ],
  "page": 1,
  "pageSize": 20,
  "total": 10,
  "totalPages": 1
}
```

#### POST /api/v1/roles

**Request:**
```json
{
  "nombre": "ENFERMERO_JEFE",
  "descripcion": "Enfermero Jefe de Servicio",
  "landingRoute": "/enfermeria"
}
```

**Response (201):**
```json
{
  "id": 15,
  "nombre": "ENFERMERO_JEFE",
  "descripcion": "Enfermero Jefe de Servicio",
  "landingRoute": "/enfermeria"
}
```

**Error (400):**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Ya existe un rol con este nombre",
  "status": 400
}
```

#### PUT /api/v1/roles/:id

**Request:**
```json
{
  "nombre": "ENFERMERO_JEFE_ACTUALIZADO",
  "descripcion": "Enfermero Jefe de Servicio",
  "isActive": true
}
```

**Response (200):**
```json
{
  "message": "Rol actualizado exitosamente",
  "id": 15,
  "message": "Rol actualizado exitosamente",
  "role": { /* Role object completo */ }
}
```

#### DELETE /api/v1/roles/:id

**Response (200):**
```json
{
  "success": true,
  "message": "Rol eliminado exitosamente"
}
```

#### GET /api/v1/roles/:id

**Response (200):**
```json
{
  "role": {
    "id": 1,
    "nombre": "MEDICO",
    "descripcion": "Médico de planta",
    "isActive": true,
    "isSystem": false,
    "landingRoute": "/dashboard",
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": null,
    "creadoPor": "admin"
  },
  "permissions": [
    {
      "id": 1,
      "codigo": "expedientes:read",
      "descripcion": "Leer expedientes",
      "asignadoEn": "2025-01-01T10:00:00Z",
      "asignadoPor": "admin"
    },
    // ... más permisos
  ],
  "permissionsCount": 15
}
```

### Permissions API

#### POST /api/v1/permissions/assign

**Request:**
```json
{
  "roleId": 1,
  "permissionIds": [1, 5, 10, 15]
}
```

**Response (200):**
```json
{
  "message": "Permisos asignados exitosamente",
  "roleId": 1,
  "assignedCount": 4,
  "permissionIds": [1, 5, 10, 15]
}
```

#### DELETE /api/v1/permissions/roles/:roleId/permissions/:permissionId

**Response (200):**
```json
{
  "message": "Permiso revocado exitosamente"
}
```

#### GET /api/v1/permissions

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "codigo": "expedientes:read",
      "descripcion": "Leer expedientes"
    },
    // ... más permisos
  ],
  "total": 50
}
```

### Clinicas API

#### GET /api/v1/clinicas

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "nombre": "CUAUHTÉMOC",
      "folio": "C"
    },
    {
      "id": 2,
      "nombre": "DOCTORES",
      "folio": "D"
    }
    // ... más clínicas
  ]
}
```

---

## 📊 Cambios en Base de Datos Necesarios

### Tablas Principales

Basado en el estado actual de la BD, las siguientes tablas necesitan modificaciones:

1. **det_usuarios** → Renombrar campos de snake_case a camelCase en el backend para responses
2. **cat_roles** → Renombrar campos de snake_case a camelCase en el backend para responses
3. **cat_permissions** → Renombrar campos de snake_case a camelCase en el backend para responses
4. **user_permission_overrides** → Renombrar campos de snake_case a camelCase en el backend para responses

### Ejemplo de Conversión

**Backend (Python Flask):**
```python
# Convertir de snake_case a camelCase
def to_camel_case(snake_str):
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

# Ejemplo en endpoint
@app.route('/api/v1/users', methods=['GET'])
def get_users():
    users = db.query('SELECT * FROM det_usuarios')
    # Convertir resultados a camelCase
    return jsonify({
        'items': [to_camel_case(col) for col in users._asdict()],
        'page': request.args.get('page', 1),
        # ... más campos
    })
```

---

## 🎯 Próximos Pasos para el Backend

1. **Implementar todos los endpoints** según los contratos definidos en este documento
2. **Aplicar conversión de snake_case a camelCase** en las responses del backend
3. **Implementar Request IDs** y retornarlos en todas las responses
4. **Implementar rate limiting** con headers X-RateLimit-*
5. **Implementar audit logging** para requests con datos de pacientes
6. **Implementar retry logic** en el frontend si aplica (actualmente implementado)
7. **Validar contratos con Zod** (si el backend usa TypeScript o Pydantic)

---

## 📚 Referencias

- [API Standards Document](./standards.md)
- [Zod Documentation](https://zod.dev)
- [FHIR - HL7 Fast Healthcare Interoperability Resources](https://hl7.org/fhir/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/)
- [REST API Design Best Practices](https://restfulapi.net/)

---

## 📞 Soporte

Si hay dudas sobre estos contratos, consulte al equipo de frontend o revisa los Zod schemas en `frontend/src/api/schemas/`.
