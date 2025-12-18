# 🚀 SIRES API Documentation - Auth Module

Esta documentación detalla los contratos de comunicación entre el Frontend y el Backend para el módulo de Autenticación.

## 📌 Estándares de Respuesta

Todas las respuestas de error siguen este formato estándar:

```json
{
  "code": "STRING_CODE",
  "message": "Mensaje legible para el usuario"
}
```

### Códigos de Estado Comunes:
- `200 OK`: Petición exitosa.
- `400 Bad Request`: Error en los datos enviados.
- `401 Unauthorized`: Token inválido o expirado.
- `403 Forbidden`: No tiene permisos para esta acción.
- `423 Locked`: Usuario bloqueado por múltiples intentos.
- `500 Internal Server Error`: Error no controlado en el servidor.

---

## 🔐 Endpoints de Autenticación

### 1. Login de Usuario
`POST /auth/login`

**Request Body:**
```json
{
  "usuario": "admin",
  "clave": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id_usuario": 1,
    "usuario": "admin",
    "nombre_completo": "Juan Pérez",
    "must_change_password": false
  }
}
```

**Errores Posibles:**
- `401 INVALID_CREDENTIALS`: "Usuario o contraseña incorrectos"
- `423 USER_LOCKED`: "Usuario temporalmente bloqueado"

---

### 2. Recuperación de Contraseña (Fase 1: Solicitar Código)
`POST /auth/request-reset-code`

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Código enviado al correo"
}
```

---

### 3. Recuperación de Contraseña (Fase 2: Verificar Código)
`POST /auth/verify-reset-code`

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "reset_token": "TEMP_TOKEN_JWT"
}
```

---

### 4. Recuperación de Contraseña (Fase 3: Nueva Contraseña)
`POST /auth/reset-password`
*Requiere Header: `Authorization: Bearer TEMP_TOKEN_JWT`*

**Request Body:**
```json
{
  "new_password": "nueva_password_segura"
}
```

---

### 5. Onboarding (Primer Inicio de Sesión)
`POST /auth/complete-onboarding`

**Request Body:**
```json
{
  "id_usuario": 1,
  "new_password": "password_definitiva",
  "terms_accepted": true
}
```

**Nota de Seguridad:** Actualmente este endpoint requiere `id_usuario`. Se recomienda migrar a validación por token de sesión.
