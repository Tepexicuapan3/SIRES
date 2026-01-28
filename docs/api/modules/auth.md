# API Auth - Contratos

> TL;DR: Contratos oficiales de autenticacion. Backend y frontend deben cumplir estos payloads y errores.

## Problem / Context

SIRES es un sistema medico critico. Un mismatch en auth rompe sesiones, permisos y auditoria. Este documento define la forma exacta de los payloads y los errores (con mensajes de toast) para asegurar consistencia.

**Fuente de verdad**
- `docs/api/standards.md`
- `frontend/src/api/types/auth.types.ts`
- `frontend/src/api/utils/errors.ts`

**Reglas clave**
- JWT en cookies HttpOnly (no tokens en body ni storage).
- CSRF obligatorio en mutaciones.
- Errores siguen el formato `ApiError` del estandar.

Base URL
```
http://localhost:5000/api/v1
```

## Solution / Implementation

### AuthUser (entidad base)
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

**Notas de contrato**
- `landingRoute` puede ser `null`.
- `roles` y `permissions` deben ser arrays (no `null`).
- `requiresOnboarding` debe venir en `/auth/me`.

### Mapeo AuthUser -> BD
| Campo API | Fuente BD | Notas |
| --- | --- | --- |
| `id` | `sy_usuarios.id_usuario` | PK interna |
| `username` | `sy_usuarios.usuario` | login principal |
| `fullName` | `det_usuarios.nombre_completo` | concatenado y almacenado |
| `email` | `sy_usuarios.correo` | unico |
| `primaryRole` | `cat_roles.rol` | desde `rel_usuario_roles.is_primary = 1` |
| `landingRoute` | `cat_roles.landing_route` | puede ser `null` |
| `roles` | `cat_roles.rol[]` | roles activos del usuario |
| `permissions` | `cat_permisos.codigo[]` | roles + overrides, admin => `*` |
| `mustChangePassword` | `sy_usuarios.cambiar_clave` | booleano |
| `requiresOnboarding` | derivado | `cambiar_clave` o `terminos_acept = false` |

### Reglas de permisos
- Admin se determina por `cat_roles.is_admin = true` y se responde `permissions: ["*"]`.
- Overrides activos (`rel_usuario_overrides`) se aplican despues de permisos por rol.
- Overrides expirados se ignoran.

### Auditoria (obligatoria)
Cada endpoint debe registrar en `auditoria_eventos`:
- `fch_evento`, `request_id`, `accion`, `resultado`.
- `actor_id_usuario` si hay sesion y `target_id_usuario` si aplica.
- `ip_origen`, `user_agent`, `codigo_error` en fallos.
- `meta` con contexto (endpoint, username/email enmascarado, modulo).

### Endpoints

#### POST `/auth/login`

**200 OK**
```json
{
  "user": { "...AuthUser" },
  "requiresOnboarding": false
}
```

**Errores (mensaje para toast)**
| Code | Status | Message |
| --- | --- | --- |
| `INVALID_CREDENTIALS` | 401 | Usuario o contraseña incorrectos |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado |
| `USER_INACTIVE` | 403 | Cuenta desactivada por un administrador |
| `ACCOUNT_LOCKED` | 423 | Cuenta bloqueada por intentos fallidos |
| `ACCOUNT_EXPIRED` | 401 | Tu cuenta ha expirado. Contacta a soporte |
| `RATE_LIMIT_EXCEEDED` | 429 | Demasiadas solicitudes, espera un momento |
| `SERVICE_UNAVAILABLE` | 503 | Servicio temporalmente no disponible |
| `TOKEN_EXPIRED` | 401 | Tu sesión ha expirado |
| `TOKEN_INVALID` | 401 | Token inválido |
| `SESSION_EXPIRED` | 401 | Tu sesión ha expirado |
| `INTERNAL_SERVER_ERROR` | 500 | Error del servidor, intenta nuevamente |
| `NETWORK_ERROR` | 0 | No hay conexión a internet |
| `TIMEOUT_ERROR` | 0 | La solicitud excedió el tiempo de espera |

#### GET `/auth/me`

**200 OK**
```json
{ "...AuthUser" }
```

**Errores (mensaje para toast)**
| Code | Status | Message |
| --- | --- | --- |
| `TOKEN_EXPIRED` | 401 | Tu sesión ha expirado |
| `TOKEN_INVALID` | 401 | Token inválido |
| `SESSION_EXPIRED` | 401 | Tu sesión ha expirado |
| `PERMISSION_DENIED` | 403 | No tienes permiso para esta acción |
| `INTERNAL_SERVER_ERROR` | 500 | Error del servidor, intenta nuevamente |
| `NETWORK_ERROR` | 0 | No hay conexión a internet |
| `TIMEOUT_ERROR` | 0 | La solicitud excedió el tiempo de espera |

#### POST `/auth/logout`

**200 OK**
```json
{ "success": true }
```

**Errores (mensaje para toast)**
| Code | Status | Message |
| --- | --- | --- |
| `TOKEN_EXPIRED` | 401 | Tu sesión ha expirado |
| `TOKEN_INVALID` | 401 | Token inválido |
| `SESSION_EXPIRED` | 401 | Tu sesión ha expirado |
| `PERMISSION_DENIED` | 403 | No tienes permiso para esta acción |
| `INTERNAL_SERVER_ERROR` | 500 | Error del servidor, intenta nuevamente |
| `NETWORK_ERROR` | 0 | No hay conexión a internet |
| `TIMEOUT_ERROR` | 0 | La solicitud excedió el tiempo de espera |

#### GET `/auth/verify`

**200 OK**
```json
{ "valid": true }
```

**Errores**
- 401/403: frontend retorna `{ "valid": false }` (sin toast).

#### POST `/auth/refresh`

**200 OK**
```json
{ "success": true }
```

**Errores (mensaje para toast)**
| Code | Status | Message |
| --- | --- | --- |
| `REFRESH_TOKEN_EXPIRED` | 401 | Tu sesión ha expirado |
| `TOKEN_INVALID` | 401 | Token inválido |
| `SESSION_EXPIRED` | 401 | Tu sesión ha expirado |
| `INTERNAL_SERVER_ERROR` | 500 | Error del servidor, intenta nuevamente |
| `NETWORK_ERROR` | 0 | No hay conexión a internet |
| `TIMEOUT_ERROR` | 0 | La solicitud excedió el tiempo de espera |

#### POST `/auth/request-reset-code`

**200 OK**
```json
{ "success": true }
```

**Errores (mensaje para toast)**
| Code | Status | Message |
| --- | --- | --- |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado |
| `RATE_LIMIT_EXCEEDED` | 429 | Demasiadas solicitudes, espera un momento |
| `INTERNAL_SERVER_ERROR` | 500 | Error del servidor, intenta nuevamente |
| `NETWORK_ERROR` | 0 | No hay conexión a internet |
| `TIMEOUT_ERROR` | 0 | La solicitud excedió el tiempo de espera |

#### POST `/auth/verify-reset-code`

**200 OK**
```json
{ "valid": true }
```

**Errores (mensaje para toast)**
| Code | Status | Message |
| --- | --- | --- |
| `CODE_EXPIRED` | 400 | El código ha expirado o fue invalidado |
| `INVALID_CODE` | 400 | Código incorrecto |
| `RATE_LIMIT_EXCEEDED` | 429 | Demasiadas solicitudes, espera un momento |
| `INTERNAL_SERVER_ERROR` | 500 | Error del servidor, intenta nuevamente |
| `NETWORK_ERROR` | 0 | No hay conexión a internet |
| `TIMEOUT_ERROR` | 0 | La solicitud excedió el tiempo de espera |

#### POST `/auth/reset-password`

**200 OK**
```json
{
  "user": { "...AuthUser" },
  "requiresOnboarding": false
}
```

**Errores (mensaje para toast)**
| Code | Status | Message |
| --- | --- | --- |
| `TOKEN_EXPIRED` | 401 | Tu sesión ha expirado |
| `TOKEN_INVALID` | 401 | Token inválido |
| `SESSION_EXPIRED` | 401 | Tu sesión ha expirado |
| `PASSWORD_TOO_WEAK` | 400 | La contraseña es demasiado débil |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado |
| `INTERNAL_SERVER_ERROR` | 500 | Error del servidor, intenta nuevamente |
| `NETWORK_ERROR` | 0 | No hay conexión a internet |
| `TIMEOUT_ERROR` | 0 | La solicitud excedió el tiempo de espera |

#### POST `/auth/complete-onboarding`

**200 OK**
```json
{
  "user": { "...AuthUser" },
  "requiresOnboarding": false
}
```

**Errores (mensaje para toast)**
| Code | Status | Message |
| --- | --- | --- |
| `TERMS_NOT_ACCEPTED` | 400 | Debes aceptar los términos y condiciones |
| `PASSWORD_TOO_WEAK` | 400 | La contraseña es demasiado débil |
| `TOKEN_EXPIRED` | 401 | Tu sesión ha expirado |
| `TOKEN_INVALID` | 401 | Token inválido |
| `SESSION_EXPIRED` | 401 | Tu sesión ha expirado |
| `ONBOARDING_FAILED` | 500 | No se pudo completar el onboarding |
| `INTERNAL_SERVER_ERROR` | 500 | Error del servidor, intenta nuevamente |
| `NETWORK_ERROR` | 0 | No hay conexión a internet |
| `TIMEOUT_ERROR` | 0 | La solicitud excedió el tiempo de espera |

### Backend checklist por endpoint (BD + auditoria)

#### POST `/auth/login`
- Lee BD: `sy_usuarios`, `det_usuarios`, `rel_usuario_roles`, `cat_roles`, `rel_rol_permisos`, `cat_permisos`, `rel_usuario_overrides`.
- Escribe BD: `sy_usuarios.last_conexion`, `sy_usuarios.ip_ultima`, `sy_usuarios.fch_modf`, `sy_usuarios.usr_modf`.
- Auditoria: `LOGIN_SUCCESS` o `LOGIN_FAILED` con `codigo_error` si falla.

#### GET `/auth/me`
- Lee BD: mismas tablas de permisos/roles que login.
- Escribe BD: no aplica.
- Auditoria: `SESSION_VALIDATE` (success/fail).

#### POST `/auth/logout`
- Lee BD: no aplica.
- Escribe BD: no aplica.
- Auditoria: `LOGOUT`.

#### GET `/auth/verify`
- Lee BD: no aplica.
- Escribe BD: no aplica.
- Auditoria: `TOKEN_VERIFY` (opcional).

#### POST `/auth/refresh`
- Lee BD: no aplica (token via cookies).
- Escribe BD: no aplica.
- Auditoria: `TOKEN_REFRESH` (success/fail).

#### POST `/auth/request-reset-code`
- Lee BD: `sy_usuarios` por `correo`.
- Escribe BD: no aplica (OTP vive en Redis).
- Auditoria: `RESET_CODE_REQUESTED` (success/fail).

#### POST `/auth/verify-reset-code`
- Lee BD: `sy_usuarios` por `correo` (solo para auditoria).
- Escribe BD: no aplica (OTP vive en Redis).
- Auditoria: `RESET_CODE_VERIFIED` o `RESET_CODE_FAILED`.

#### POST `/auth/reset-password`
- Lee BD: `sy_usuarios` por token temporal.
- Escribe BD: `sy_usuarios.clave_hash`, `sy_usuarios.cambiar_clave = false`, `sy_usuarios.fch_modf`, `sy_usuarios.usr_modf`.
- Escribe BD (si devuelve sesion): `sy_usuarios.last_conexion`, `sy_usuarios.ip_ultima`.
- Auditoria: `PASSWORD_RESET_SUCCESS` o `PASSWORD_RESET_FAILED`.

#### POST `/auth/complete-onboarding`
- Lee BD: `sy_usuarios` por token temporal.
- Escribe BD: `sy_usuarios.clave_hash`, `sy_usuarios.cambiar_clave = false`, `sy_usuarios.terminos_acept = true`, `sy_usuarios.fch_terminos`.
- Escribe BD (si devuelve sesion): `sy_usuarios.last_conexion`, `sy_usuarios.ip_ultima`.
- Auditoria: `ONBOARDING_COMPLETED` o `ONBOARDING_FAILED`.

## Examples

**Login OK (200)**
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

**Auditoria login (insert en `auditoria_eventos`)**
```json
{
  "accion": "LOGIN_SUCCESS",
  "resultado": "SUCCESS",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "actor_id_usuario": 1,
  "target_id_usuario": 1,
  "ip_origen": "192.168.1.10",
  "user_agent": "Mozilla/5.0",
  "meta": {
    "endpoint": "/auth/login"
  }
}
```

## References
- `docs/api/standards.md`
- `frontend/src/api/types/auth.types.ts`
- `frontend/src/api/utils/errors.ts`
- `frontend/src/api/resources/auth.api.ts`
