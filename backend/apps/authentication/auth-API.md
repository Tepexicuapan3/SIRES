# API Contract: Authentication Module

> **Versión:** 1.0.0  
> **Última actualización:** 2025-01-19  
> **Responsable Frontend:** Este documento  
> **Base URL:** `/api/v1`

## Índice

1. [Convenciones Generales](#convenciones-generales)
2. [Seguridad y Autenticación](#seguridad-y-autenticación)
3. [Endpoints](#endpoints)
   - [POST /auth/login](#post-authlogin)
   - [POST /auth/logout](#post-authlogout)
   - [GET /auth/me](#get-authme)
   - [GET /auth/verify](#get-authverify)
   - [POST /auth/refresh](#post-authrefresh)
   - [POST /auth/complete-onboarding](#post-authcomplete-onboarding)
   - [POST /auth/request-reset-code](#post-authrequest-reset-code)
   - [POST /auth/verify-reset-code](#post-authverify-reset-code)
   - [POST /auth/reset-password](#post-authreset-password)
4. [Códigos de Error](#códigos-de-error)
5. [Tipos de Datos](#tipos-de-datos)

---

## Convenciones Generales

### Nomenclatura de Campos

| Convención               | Ejemplo                                          | Uso                   |
| ------------------------ | ------------------------------------------------ | --------------------- |
| **camelCase**            | `clinicId`, `fullName`, `mustChangePassword` | Todos los campos JSON |
| **SCREAMING_SNAKE_CASE** | `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`           | Códigos de error      |

> ⚠️ **CRÍTICO:** El backend DEBE convertir snake_case de la BD a camelCase en las respuestas JSON.
> El frontend NO hace conversión de nomenclatura.

### Headers Requeridos

```http
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid-v4>           # Generado por frontend para trazabilidad
X-CSRF-TOKEN: <token>             # Requerido en requests mutantes (POST, PUT, PATCH, DELETE)
```

### Estructura de Respuestas de Error

Todas las respuestas de error DEBEN seguir esta estructura:

```json
{
  "code": "CODIGO_ERROR",
  "message": "Mensaje legible para el usuario",
  "status": 400,
  "details": {
    "campo1": ["Error especifico del campo"],
    "campo2": ["Otro error"]
  },
  "requestId": "uuid-del-request",
  "timestamp": "2025-01-19T14:30:00Z"
}
```

| Campo       | Tipo      | Requerido | Descripción                                    |
| ----------- | --------- | --------- | ---------------------------------------------- |
| `code`      | `string`  | ✅        | Código de error (ver sección Códigos de Error) |
| `message`   | `string`  | ✅        | Mensaje user-friendly en español               |
| `status`    | `number`  | ✅        | HTTP status code                               |
| `details`   | `object`  | ❌        | Errores de validación por campo                |
| `requestId` | `string`  | ❌        | UUID del request para debugging                |
| `timestamp` | `string`  | ❌        | ISO 8601 UTC                                   |

---

## Seguridad y Autenticación

### Manejo de Tokens JWT

| Token             | Almacenamiento                                 | Duración         | Uso                       |
| ----------------- | ---------------------------------------------- | ---------------- | ------------------------- |
| **Access Token**  | Cookie `HttpOnly`, `Secure`, `SameSite=Strict` | 15 minutos       | Autenticación de requests |
| **Refresh Token** | Cookie `HttpOnly`, `Secure`, `SameSite=Strict` | 7 días           | Renovar access token      |
| **CSRF Token**    | Cookie readable por JS                         | Igual que access | Header `X-CSRF-TOKEN`     |

> ⚠️ **NUNCA** enviar tokens en el body de la respuesta. Siempre usar cookies HttpOnly.

### Cookies que debe setear el Backend

```http
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=900
Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800
Set-Cookie: csrf_token=<token>; Secure; SameSite=Strict; Path=/; Max-Age=900
```

### Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUJO DE LOGIN                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Usuario envía credenciales                                  │
│     POST /auth/login { usuario, clave }                         │
│                                                                 │
│  2. Backend valida y responde con:                              │
│     - Set-Cookie: access_token (HttpOnly)                       │
│     - Set-Cookie: refresh_token (HttpOnly)                      │
│     - Set-Cookie: csrf_token (readable)                         │
│     - Body: { user: AuthUser, requiresOnboarding?: boolean }    │
│                                                                 │
│  3. Si requiresOnboarding = true:                               │
│     Frontend redirige a /onboarding                             │
│     Usuario debe completar POST /auth/complete-onboarding       │
│                                                                 │
│  4. Requests subsecuentes:                                      │
│     - Browser envía cookies automáticamente                     │
│     - Frontend agrega header X-CSRF-TOKEN                       │
│                                                                 │
│  5. Cuando access_token expira (401):                           │
│     Frontend automáticamente llama POST /auth/refresh           │
│     Backend rota ambos tokens si refresh_token es válido        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Endpoints

### POST /auth/login

Iniciar sesión en el sistema.

**Permisos:** Público

**Request Body:**

```json
{
  "usuario": "jperez",
  "clave": "MiPassword123!"
}
```

| Campo     | Tipo     | Requerido | Validación                 |
| --------- | -------- | --------- | -------------------------- |
| `usuario` | `string` | ✅        | Min: 2, Max: 10 caracteres |
| `clave`   | `string` | ✅        | Min: 8 caracteres          |

**Response 200 OK:**

```json
{
  "user": {
    "id": 1,
    "username": "jperez",
    "fullName": "Juan Perez",
    "email": "jperez@metro.cdmx.gob.mx",
    "primaryRole": "ADMIN",
    "landingRoute": "/admin",
    "roles": ["ADMIN"],
    "permissions": ["*"],
    "mustChangePassword": false,
    "requiresOnboarding": false
  },
  "requiresOnboarding": false
}
```

| Campo                | Tipo       | Descripción                                         |
| -------------------- | ---------- | --------------------------------------------------- |
| `user`               | `AuthUser` | Datos completos del usuario autenticado             |
| `requiresOnboarding` | `boolean?` | `true` si es primer login y debe cambiar contraseña |

**Cookies Seteadas (Headers):**

```http
Set-Cookie: access_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=900
Set-Cookie: refresh_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800
Set-Cookie: csrf_token=abc123...; Secure; SameSite=Strict; Path=/; Max-Age=900
```

**Errores Posibles:**

| Status | Código                  | Cuándo                                      |
| ------ | ----------------------- | ------------------------------------------- |
| 401    | `INVALID_CREDENTIALS`   | Usuario o contraseña incorrectos            |
| 404    | `USER_NOT_FOUND`        | Usuario no encontrado                        |
| 403    | `USER_INACTIVE`         | Cuenta desactivada por un administrador      |
| 423    | `ACCOUNT_LOCKED`        | Cuenta bloqueada por intentos fallidos       |
| 401    | `ACCOUNT_EXPIRED`       | Tu cuenta ha expirado                         |
| 429    | `RATE_LIMIT_EXCEEDED`   | Demasiadas solicitudes, espera un momento    |
| 503    | `SERVICE_UNAVAILABLE`   | Servicio temporalmente no disponible         |
| 401    | `TOKEN_EXPIRED`         | Tu sesión ha expirado                        |
| 401    | `TOKEN_INVALID`         | Token inválido                               |
| 401    | `SESSION_EXPIRED`       | Tu sesión ha expirado                        |
| 500    | `INTERNAL_SERVER_ERROR` | Error del servidor, intenta nuevamente       |
| 0      | `NETWORK_ERROR`         | No hay conexión a internet                   |
| 0      | `TIMEOUT_ERROR`         | La solicitud excedió el tiempo de espera    |

---

### POST /auth/logout

Cerrar sesión actual e invalidar tokens.

**Permisos:** Autenticado (access_token válido)

**Request Body:** Ninguno

**Response 200 OK:**

```json
{
  "success": true
}
```

**Cookies a Limpiar (Headers):**

```http
Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=0
Set-Cookie: csrf_token=; Secure; SameSite=Strict; Path=/; Max-Age=0
```

**Errores Posibles:**

| Status | Código                  | Cuándo                                      |
| ------ | ----------------------- | ------------------------------------------- |
| 401    | `TOKEN_EXPIRED`         | Tu sesión ha expirado                        |
| 401    | `TOKEN_INVALID`         | Token inválido                               |
| 401    | `SESSION_EXPIRED`       | Tu sesión ha expirado                        |
| 403    | `PERMISSION_DENIED`     | No tienes permiso para esta acción           |
| 500    | `INTERNAL_SERVER_ERROR` | Error del servidor, intenta nuevamente       |
| 0      | `NETWORK_ERROR`         | No hay conexión a internet                   |
| 0      | `TIMEOUT_ERROR`         | La solicitud excedió el tiempo de espera    |

---

### GET /auth/me

Obtener datos del usuario autenticado actual.

**Permisos:** Autenticado (access_token válido)

**Request Body:** Ninguno

**Response 200 OK:**

```json
{
  "id": 1,
  "username": "jperez",
  "fullName": "Juan Perez",
  "email": "jperez@metro.cdmx.gob.mx",
  "primaryRole": "ADMIN",
  "landingRoute": "/admin",
  "roles": ["ADMIN"],
  "permissions": ["*"],
  "mustChangePassword": false,
  "requiresOnboarding": false
}
```

> ℹ️ Retorna el mismo `AuthUser` que el login, útil para rehidratar sesión al recargar página.

**Errores Posibles:**

| Status | Código                  | Cuándo                                      |
| ------ | ----------------------- | ------------------------------------------- |
| 401    | `TOKEN_EXPIRED`         | Tu sesión ha expirado                        |
| 401    | `TOKEN_INVALID`         | Token inválido                               |
| 401    | `SESSION_EXPIRED`       | Tu sesión ha expirado                        |
| 403    | `PERMISSION_DENIED`     | No tienes permiso para esta acción           |
| 500    | `INTERNAL_SERVER_ERROR` | Error del servidor, intenta nuevamente       |
| 0      | `NETWORK_ERROR`         | No hay conexión a internet                   |
| 0      | `TIMEOUT_ERROR`         | La solicitud excedió el tiempo de espera    |

---

### GET /auth/verify

Verificar si el token actual es válido (healthcheck de sesión).

**Permisos:** Autenticado (access_token válido)

**Request Body:** Ninguno

**Response 200 OK:**

```json
{
  "valid": true
}
```

**Response 401 Unauthorized:**

```json
{
  "valid": false
}
```

> ℹ️ Este endpoint es ligero, ideal para guardias de navegación. No retorna datos del usuario.

---

### POST /auth/refresh

Renovar access token usando refresh token.

**Permisos:** Público (usa refresh_token de cookie)

**Request Body:** Ninguno

**Response 200 OK:**

```json
{
  "success": true
}
```

**Cookies Seteadas:**

```http
Set-Cookie: access_token=<nuevo_jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=900
Set-Cookie: csrf_token=<nuevo_token>; Secure; SameSite=Strict; Path=/; Max-Age=900
```

> ℹ️ El frontend llama este endpoint automáticamente cuando recibe 401 en cualquier request.

**Errores Posibles:**

| Status | Código                  | Cuándo                                      |
| ------ | ----------------------- | ------------------------------------------- |
| 401    | `REFRESH_TOKEN_EXPIRED` | Tu sesión ha expirado                        |
| 401    | `TOKEN_INVALID`         | Token inválido                               |
| 401    | `SESSION_EXPIRED`       | Tu sesión ha expirado                        |
| 500    | `INTERNAL_SERVER_ERROR` | Error del servidor, intenta nuevamente       |
| 0      | `NETWORK_ERROR`         | No hay conexión a internet                   |
| 0      | `TIMEOUT_ERROR`         | La solicitud excedió el tiempo de espera    |

---

### POST /auth/complete-onboarding

Completar registro inicial (cambiar contraseña temporal y aceptar términos).

**Permisos:** Autenticado con `mustChangePassword: true`

**Request Body:**

```json
{
  "newPassword": "NuevaPassword123!",
  "termsAccepted": true
}
```

| Campo           | Tipo      | Requerido | Validación                  |
| --------------- | --------- | --------- | --------------------------- |
| `newPassword`   | `string`  | ✅        | Min: 8, Max: 255 caracteres |
| `termsAccepted` | `boolean` | ✅        | Debe ser `true`             |

**Response 200 OK:**

```json
{
  "user": {
    "id": 1,
    "username": "jperez",
    "fullName": "Juan Perez",
    "email": "jperez@metro.cdmx.gob.mx",
    "primaryRole": "ADMIN",
    "landingRoute": "/admin",
    "roles": ["ADMIN"],
    "permissions": ["*"],
    "mustChangePassword": false,
    "requiresOnboarding": false
  },
  "requiresOnboarding": false
}
```

> ℹ️ Retorna `LoginResponse` con nuevos tokens (auto-login después de onboarding).

**Errores Posibles:**

| Status | Código                  | Cuándo                                      |
| ------ | ----------------------- | ------------------------------------------- |
| 400    | `TERMS_NOT_ACCEPTED`    | Debes aceptar los términos y condiciones     |
| 400    | `PASSWORD_TOO_WEAK`     | La contraseña es demasiado débil            |
| 401    | `TOKEN_EXPIRED`         | Tu sesión ha expirado                        |
| 401    | `TOKEN_INVALID`         | Token inválido                               |
| 401    | `SESSION_EXPIRED`       | Tu sesión ha expirado                        |
| 500    | `ONBOARDING_FAILED`     | No se pudo completar el onboarding          |
| 500    | `INTERNAL_SERVER_ERROR` | Error del servidor, intenta nuevamente       |
| 0      | `NETWORK_ERROR`         | No hay conexión a internet                   |
| 0      | `TIMEOUT_ERROR`         | La solicitud excedió el tiempo de espera    |

---

### POST /auth/request-reset-code

Solicitar código OTP para recuperar contraseña.

**Permisos:** Público

**Request Body:**

```json
{
  "correo": "jperez@metro.cdmx.gob.mx"
}
```

| Campo    | Tipo     | Requerido | Validación   |
| -------- | -------- | --------- | ------------ |
| `correo` | `string` | ✅        | Email válido |

**Response 200 OK:**

```json
{
  "success": true
}
```

**Lógica de Negocio:**

1. Buscar usuario por email
2. Si existe:
   - Generar código OTP de 6 dígitos
   - Guardar en Redis con TTL de 10 minutos: `otp:{email}` → `{code, attempts: 0}`
   - Enviar email con código

**Errores Posibles:**

| Status | Código                | Cuándo                                     |
| ------ | --------------------- | ------------------------------------------ |
| 404    | `USER_NOT_FOUND`      | Usuario no encontrado                       |
| 429    | `RATE_LIMIT_EXCEEDED` | Demasiadas solicitudes, espera un momento   |
| 500    | `INTERNAL_SERVER_ERROR` | Error del servidor, intenta nuevamente    |
| 0      | `NETWORK_ERROR`       | No hay conexión a internet                  |
| 0      | `TIMEOUT_ERROR`       | La solicitud excedió el tiempo de espera   |

---

### POST /auth/verify-reset-code

Verificar código OTP de recuperación.

**Permisos:** Público

**Request Body:**

```json
{
  "correo": "jperez@metro.cdmx.gob.mx",
  "code": "123456"
}
```

| Campo    | Tipo     | Requerido | Validación               |
| -------- | -------- | --------- | ------------------------ |
| `correo` | `string` | ✅        | Email válido             |
| `code`   | `string` | ✅        | Exactamente 6 caracteres |

**Response 200 OK:**

```json
{
  "valid": true
}
```

**Cookies Seteadas (si válido):**

```http
Set-Cookie: reset_token=<jwt_temporal>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/reset-password; Max-Age=600
```

> ℹ️ El `reset_token` es un JWT temporal (10 min) que solo sirve para `/auth/reset-password`.

**Lógica de Negocio:**

1. Buscar OTP en Redis: `otp:{email}`
2. Si no existe: error `CODE_EXPIRED`
3. Si existe:
   - Incrementar contador de intentos
   - Si intentos > 5: Invalidar OTP, error `RATE_LIMIT_EXCEEDED`
   - Si código no coincide: error `INVALID_CODE`
   - Si código coincide:
     - Eliminar OTP de Redis
     - Generar `reset_token` JWT
     - Setear cookie
     - Retornar `{ valid: true }`

**Errores Posibles:**

| Status | Código                | Cuándo                                     |
| ------ | --------------------- | ------------------------------------------ |
| 400    | `CODE_EXPIRED`        | El código ha expirado o fue invalidado      |
| 400    | `INVALID_CODE`        | Código incorrecto                           |
| 429    | `RATE_LIMIT_EXCEEDED` | Demasiadas solicitudes, espera un momento   |
| 500    | `INTERNAL_SERVER_ERROR` | Error del servidor, intenta nuevamente    |
| 0      | `NETWORK_ERROR`       | No hay conexión a internet                  |
| 0      | `TIMEOUT_ERROR`       | La solicitud excedió el tiempo de espera   |

---

### POST /auth/reset-password

Establecer nueva contraseña usando token de recuperación.

**Permisos:** Requiere `reset_token` válido (de cookie)

**Request Body:**

```json
{
  "newPassword": "NuevaPassword123!"
}
```

| Campo         | Tipo     | Requerido | Validación                  |
| ------------- | -------- | --------- | --------------------------- |
| `newPassword` | `string` | ✅        | Min: 8, Max: 255 caracteres |

**Response 200 OK:**

```json
{
  "user": {
    "id": 1,
    "username": "jperez",
    "fullName": "Juan Perez",
    "email": "jperez@metro.cdmx.gob.mx",
    "primaryRole": "ADMIN",
    "landingRoute": "/admin",
    "roles": ["ADMIN"],
    "permissions": ["*"],
    "mustChangePassword": false,
    "requiresOnboarding": false
  },
  "requiresOnboarding": false
}
```

> ℹ️ Retorna `LoginResponse` (auto-login después de reset exitoso).

**Lógica de Negocio:**

1. Validar `reset_token` de cookie
2. Extraer `userId` del token
3. Hashear nueva contraseña
4. Actualizar en BD
5. Limpiar cookie `reset_token`
6. Generar nuevos `access_token` y `refresh_token`
7. Retornar datos del usuario

**Errores Posibles:**

| Status | Código                  | Cuándo                                      |
| ------ | ----------------------- | ------------------------------------------- |
| 401    | `TOKEN_EXPIRED`         | Tu sesión ha expirado                        |
| 401    | `TOKEN_INVALID`         | Token inválido                               |
| 401    | `SESSION_EXPIRED`       | Tu sesión ha expirado                        |
| 400    | `PASSWORD_TOO_WEAK`     | La contraseña es demasiado débil            |
| 404    | `USER_NOT_FOUND`        | Usuario no encontrado                        |
| 500    | `INTERNAL_SERVER_ERROR` | Error del servidor, intenta nuevamente       |
| 0      | `NETWORK_ERROR`         | No hay conexión a internet                   |
| 0      | `TIMEOUT_ERROR`         | La solicitud excedió el tiempo de espera    |

---

## Códigos de Error

### Códigos de Autenticación

| Código                  | HTTP Status | Descripción                             | Acción Frontend                    |
| ----------------------- | ----------- | --------------------------------------- | ---------------------------------- |
| `INVALID_CREDENTIALS`   | 401         | Usuario o contraseña incorrectos         | Mostrar error en form              |
| `USER_NOT_FOUND`        | 404         | Usuario no encontrado                    | Mostrar error                       |
| `USER_INACTIVE`         | 403         | Cuenta desactivada                       | Mostrar mensaje de cuenta inactiva |
| `ACCOUNT_LOCKED`        | 423         | Cuenta bloqueada                         | Mostrar mensaje de cuenta bloqueada |
| `ACCOUNT_EXPIRED`       | 401         | Cuenta expirada                          | Mostrar mensaje                     |
| `TOKEN_EXPIRED`         | 401         | Access token expirado                    | Intentar refresh automático        |
| `TOKEN_INVALID`         | 401         | Token malformado o revocado              | Redirigir a login                  |
| `SESSION_EXPIRED`       | 401         | Sesión expirada                           | Redirigir a login con mensaje      |
| `PERMISSION_DENIED`     | 403         | Sin permisos para la acción               | Mostrar mensaje de acceso denegado |
| `REFRESH_TOKEN_EXPIRED` | 401         | Refresh token expirado                    | Redirigir a login                  |
| `SERVICE_UNAVAILABLE`   | 503         | Servicio temporalmente no disponible      | Mostrar mensaje                     |
| `INTERNAL_SERVER_ERROR` | 500         | Error interno del servidor                | Mostrar mensaje                     |

### Códigos de Validación

| Código               | HTTP Status | Descripción                              |
| -------------------- | ----------- | ---------------------------------------- |
| `TERMS_NOT_ACCEPTED` | 400         | Debes aceptar los términos y condiciones |
| `PASSWORD_TOO_WEAK`  | 400         | La contraseña es demasiado débil         |
| `CODE_EXPIRED`       | 400         | El código ha expirado o fue invalidado   |
| `INVALID_CODE`       | 400         | Código incorrecto                        |

### Códigos de Rate Limiting

| Código                | HTTP Status | Descripción                             |
| --------------------- | ----------- | --------------------------------------- |
| `RATE_LIMIT_EXCEEDED` | 429         | Demasiadas solicitudes                  |

> ℹ️ En errores 429, incluir header `Retry-After` con segundos de espera.

---

## Tipos de Datos

### AuthUser

```typescript
interface AuthUser {
  id: number; // ID unico del usuario
  username: string; // Username (login)
  fullName: string; // Nombre completo
  email: string; // Email institucional
  primaryRole: string; // Rol primario
  landingRoute: string | null; // Ruta de aterrizaje
  roles: string[]; // Roles activos
  permissions: string[]; // Permisos efectivos
  mustChangePassword: boolean; // true si requiere cambio de clave
  requiresOnboarding: boolean; // true si debe completar onboarding
}
```

### LoginResponse

```typescript
interface LoginResponse {
  user: AuthUser;
  requiresOnboarding?: boolean; // true si es primer login
}
```

### SuccessResponse

```typescript
interface SuccessResponse {
  success: boolean;
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  code: string; // Codigo de error
  message: string; // Mensaje user-friendly
  status: number; // HTTP status code
  details?: Record<string, string[]>; // Errores por campo
  requestId?: string; // UUID para debugging
  timestamp?: string; // ISO 8601 UTC
}
```

---

## Checklist de Implementación

Antes de considerar un endpoint como "listo", verificar:

- [ ] Respuestas usan camelCase (no snake_case)
- [ ] Tokens en cookies HttpOnly, no en body
- [ ] Header `X-Request-ID` logueado para trazabilidad
- [ ] Validación de `X-CSRF-TOKEN` en endpoints mutantes
- [ ] Códigos de error consistentes con esta documentación
- [ ] Mensajes de error en español
- [ ] Rate limiting configurado (especialmente en login y reset-password)
- [ ] Logs de auditoría (login exitoso, fallido, logout)

---

## Historial de Cambios

| Versión | Fecha      | Cambios         |
| ------- | ---------- | --------------- |
| 1.0.0   | 2025-01-19 | Versión inicial |
