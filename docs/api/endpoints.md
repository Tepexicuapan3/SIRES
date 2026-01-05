# API Reference - Endpoints

Referencia rápida de endpoints backend.

---

## Base URL

```
http://localhost:5000/api/v1
```

**Producción:** Ver `backend/.env.production`

---

## Autenticación

### Headers Requeridos

**Endpoints protegidos:**
```
Cookie: access_token_cookie=<jwt>
X-CSRF-TOKEN: <csrf_token>
```

**Endpoints públicos:** Ninguno

---

## Auth Module

### POST /auth/login

**Request:**
```json
{
  "usuario": "jperez",
  "clave": "Test123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id_usuario": 123,
    "usuario": "jperez",
    "permissions": ["expedientes:read", "consultas:create"],
    "landing_route": "/consultas",
    "is_admin": false,
    "must_change_password": false,
    "terms_accepted": true
  }
}
```

**Cookies seteadas:**
- `access_token_cookie` (HttpOnly, 15min)
- `refresh_token_cookie` (HttpOnly, 7 días)
- `csrf_access_token` (15min)

**Errors:**
- `401` - `INVALID_CREDENTIALS`
- `403` - `USER_INACTIVE`
- `423` - `USER_LOCKED`

---

### POST /auth/logout

**Request:** Body vacío

**Response (200):**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

**Side effect:** Borra cookies (`unset_jwt_cookies`)

---

### POST /auth/refresh

**Request:** Body vacío (usa `refresh_token_cookie`)

**Response (200):**
```json
{
  "message": "Token refrescado correctamente"
}
```

**Cookies seteadas:**
- `access_token_cookie` (nuevo, 15min)

**Errors:**
- `401` - Refresh token inválido/expirado

---

### POST /auth/request-password-reset

**Request:**
```json
{
  "identifier": "jperez"  // Usuario o expediente
}
```

**Response (200):**
```json
{
  "message": "Código OTP enviado al correo registrado"
}
```

**Side effect:** Email con OTP (6 dígitos, TTL 10min en Redis)

**Errors:**
- `404` - `USER_NOT_FOUND`

---

### POST /auth/verify-otp

**Request:**
```json
{
  "identifier": "jperez",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "reset_token": "<jwt_15min>",
  "message": "OTP verificado correctamente"
}
```

**Errors:**
- `401` - `INVALID_OTP`
- `410` - `OTP_EXPIRED`

---

### POST /auth/reset-password

**Request:**
```json
{
  "reset_token": "<jwt>",
  "new_password": "NewPass123!"
}
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

**Errors:**
- `403` - `INVALID_TOKEN`

---

### POST /auth/complete-onboarding

**Request:**
```json
{
  "new_password": "MyPass123!",
  "terms_accepted": true
}
```

**Response (200):**
```json
{
  "message": "Onboarding completado",
  "user": {
    "must_change_password": false,
    "terms_accepted": true
  }
}
```

**Errors:**
- `400` - `VALIDATION_ERROR` (password débil)
- `403` - `TERMS_NOT_ACCEPTED`

---

## Permissions Module

### GET /permissions/catalog

**Response (200):**
```json
{
  "total": 45,
  "categories": [
    {
      "category": "EXPEDIENTES",
      "permissions": [
        {
          "id_permission": 1,
          "permission": "expedientes:create",
          "display_name": "Crear expedientes",
          "description": "Crear nuevos expedientes"
        }
      ]
    }
  ]
}
```

**Auth:** `@admin_required`

---

### GET /permissions/roles

**Response (200):**
```json
{
  "total": 8,
  "roles": [
    {
      "id_rol": 1,
      "cod_rol": "ADMINISTRADOR",
      "nom_rol": "Administradores del Sistema",
      "landing_route": "/admin",
      "priority": 1,
      "is_admin": 1,
      "permissions_count": 59
    }
  ]
}
```

**Auth:** `@admin_required`

---

### GET /permissions/role/:id

**Response (200):**
```json
{
  "role": {
    "id_rol": 2,
    "rol": "MEDICOS",
    "desc_rol": "Médicos Especialistas"
  },
  "permissions": [
    {
      "id_permission": 1,
      "permission": "expedientes:read",
      "category": "EXPEDIENTES"
    }
  ]
}
```

**Auth:** `@admin_required`

---

### POST /permissions/role/:id/assign

**Request:**
```json
{
  "permission_id": 5
}
```

**Response (200):**
```json
{
  "message": "Permiso asignado correctamente",
  "role_id": 2,
  "permission_id": 5
}
```

**Auth:** `@admin_required`

---

### POST /permissions/role/:id/revoke

**Request:**
```json
{
  "permission_id": 5
}
```

**Response (200):**
```json
{
  "message": "Permiso revocado correctamente"
}
```

**Auth:** `@admin_required`

---

### POST /permissions/cache/invalidate

**Response (200):**
```json
{
  "message": "Cache invalidado correctamente",
  "affected_users": 47
}
```

**Auth:** `@admin_required`

---

## Users Module

### POST /users

**Request:**
```json
{
  "usuario": "jperez",
  "expediente": "12345678",
  "nombre": "Juan",
  "paterno": "Pérez",
  "materno": "García",
  "curp": "PEGJ900101HDFRZN01",
  "correo": "jperez@metro.cdmx.gob.mx",
  "telefono": "5512345678",
  "id_rol": 2
}
```

**Response (201):**
```json
{
  "message": "Usuario creado correctamente...",
  "user": {
    "id_usuario": 123,
    "usuario": "jperez",
    "temp_password": "Abc123!@#XyZ",
    "must_change_password": true,
    "rol_asignado": 2
  }
}
```

**Auth:** `@admin_required`

**Errors:**
- `409` - `USUARIO_EXISTS` / `EXPEDIENTE_EXISTS`
- `422` - `VALIDATION_ERROR`

---

## Contratos de Error

Todos los endpoints retornan errores con este formato:

```json
{
  "code": "ERROR_CODE",
  "message": "Mensaje descriptivo"
}
```

### Códigos Comunes

| Code | Status | Descripción |
|------|--------|-------------|
| `INVALID_REQUEST` | 400 | Faltan campos o JSON inválido |
| `VALIDATION_ERROR` | 422 | Reglas de negocio/formato |
| `UNAUTHORIZED` | 401 | No autenticado |
| `FORBIDDEN` | 403 | Sin permisos |
| `NOT_FOUND` | 404 | Recurso no existe |
| `CONFLICT` | 409 | Conflicto (duplicado) |
| `TOO_MANY_REQUESTS` | 429 | Rate limit (futuro) |
| `SERVER_ERROR` | 500 | Error interno |

---

## Paginación (Convención)

**Query params:**
```
?page=1&page_size=20
```

**Response:**
```json
{
  "items": [...],
  "page": 1,
  "page_size": 20,
  "total": 150  // Opcional
}
```

**Límites:**
- `page_size` max: 200
- `page_size` default: 20

---

## Próximos Pasos

- **Agregar endpoint:** Documentarlo aquí en formato consistente
- **Testing:** Ver `docs/guides/testing.md`
- **Frontend integration:** Ver `docs/guides/adding-feature.md`

---

**Última actualización:** Enero 2026
