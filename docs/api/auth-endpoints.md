# Referencia de API - Endpoints de Autenticación

Contratos detallados de comunicación entre frontend y backend para el módulo de autenticación.

---

## Índice

1. [Estándares de Respuesta](#estándares-de-respuesta)
2. [Tipos TypeScript](#tipos-typescript)
3. [Endpoints de Autenticación](#endpoints-de-autenticación)
4. [Endpoints de Recuperación de Contraseña](#endpoints-de-recuperación-de-contraseña)
5. [Endpoint de Onboarding](#endpoint-de-onboarding)
6. [Manejo de Errores](#manejo-de-errores)

---

## Estándares de Respuesta

### Respuesta Exitosa (2xx)

```json
{
  "data": "...",
  "message": "Operación exitosa"
}
```

### Respuesta de Error (4xx, 5xx)

```json
{
  "code": "STRING_CODE",
  "message": "Mensaje legible para el usuario"
}
```

### Códigos de Estado HTTP

| Código | Nombre                | Descripción                                    |
| ------ | --------------------- | ---------------------------------------------- |
| 200    | OK                    | Petición exitosa                               |
| 400    | Bad Request           | Datos inválidos o faltantes en el request      |
| 401    | Unauthorized          | Token inválido, expirado o credenciales erróneas |
| 403    | Forbidden             | Usuario inactivo o sin permisos                |
| 404    | Not Found             | Recurso no encontrado (ej: usuario no existe)  |
| 423    | Locked                | Usuario bloqueado por múltiples intentos       |
| 500    | Internal Server Error | Error no controlado en el servidor             |

---

## Tipos TypeScript

### Tipos de Request

#### LoginRequest
```typescript
interface LoginRequest {
  usuario: string;  // Nombre de usuario (ej: "admin")
  clave: string;    // Contraseña en texto plano
}
```

#### RefreshTokenRequest
```typescript
interface RefreshTokenRequest {
  refresh_token: string;  // Token de renovación
}
```

#### RequestResetCodeRequest
```typescript
interface RequestResetCodeRequest {
  email: string;  // Correo electrónico del usuario
}
```

#### VerifyResetCodeRequest
```typescript
interface VerifyResetCodeRequest {
  email: string;  // Correo electrónico
  code: string;   // Código OTP de 6 dígitos
}
```

#### ResetPasswordRequest
```typescript
interface ResetPasswordRequest {
  reset_token: string;   // Token temporal de restablecimiento
  new_password: string;  // Nueva contraseña
}
```

#### CompleteOnboardingRequest
```typescript
interface CompleteOnboardingRequest {
  new_password: string;     // Nueva contraseña definitiva
  terms_accepted: boolean;  // Aceptación de términos y condiciones
}
```

### Tipos de Response

#### Usuario
```typescript
interface Usuario {
  id_usuario: number;          // ID único del usuario
  usuario: string;             // Nombre de usuario
  nombre: string;              // Nombre(s)
  paterno: string;             // Apellido paterno
  materno: string;             // Apellido materno
  nombre_completo: string;     // Nombre completo (computed)
  expediente: string;          // Número de expediente
  curp: string;                // CURP del usuario
  correo: string;              // Correo electrónico
  ing_perfil: string;          // Perfil de ingreso
  roles: string[];             // Lista de roles ['ADMIN', 'ROL_MEDICO']
  permisos?: string[];         // Permisos específicos (opcional)
  must_change_password: boolean; // Indica si requiere cambiar contraseña
}
```

#### LoginResponse
```typescript
interface LoginResponse {
  access_token: string;    // JWT de acceso
  refresh_token: string;   // JWT de renovación
  token_type: "Bearer";    // Tipo de token (siempre "Bearer")
  expires_in: number;      // Segundos hasta expiración (ej: 3600)
  user: Usuario;           // Datos del usuario autenticado
}
```

#### RefreshTokenResponse
```typescript
interface RefreshTokenResponse {
  access_token: string;    // Nuevo JWT de acceso
  token_type: "Bearer";    // Tipo de token
  expires_in: number;      // Segundos hasta expiración
}
```

#### VerifyResetCodeResponse
```typescript
interface VerifyResetCodeResponse {
  valid: boolean;       // Si el código es válido
  reset_token: string;  // Token temporal para cambiar contraseña
}
```

---

## Endpoints de Autenticación

### 1. Login de Usuario

Autentica un usuario con sus credenciales.

| Propiedad   | Valor              |
| ----------- | ------------------ |
| **Método**  | `POST`             |
| **URL**     | `/auth/login`      |
| **Auth**    | No requerida       |

**Request Body:**
```json
{
  "usuario": "admin",
  "clave": "password123"
}
```

**Response Exitosa (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id_usuario": 1,
    "usuario": "admin",
    "nombre": "Juan",
    "paterno": "Perez",
    "materno": "Lopez",
    "nombre_completo": "Juan Perez Lopez",
    "expediente": "54321",
    "curp": "JUAN800101HDFRRN01",
    "correo": "juan.perez@metro.cdmx.gob.mx",
    "ing_perfil": "Administrador",
    "roles": ["ADMIN", "ROL_MEDICO"],
    "must_change_password": false
  }
}
```

**Errores Posibles:**

| Status | Código              | Mensaje                                       |
| ------ | ------------------- | --------------------------------------------- |
| 400    | INVALID_REQUEST     | Usuario y contraseña son requeridos           |
| 401    | INVALID_CREDENTIALS | Usuario o contraseña incorrectos              |
| 403    | USER_INACTIVE       | Usuario inactivo                              |
| 423    | USER_LOCKED         | Usuario temporalmente bloqueado               |
| 500    | SERVER_ERROR        | Error interno del servidor                    |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

const response = await authAPI.login({
  usuario: "admin",
  clave: "password123"
});
```

**Notas:**
- Si `must_change_password: true`, redirigir al flujo de Onboarding
- El backend obtiene la IP del cliente via header `X-Forwarded-For`

---

### 2. Logout de Usuario

Cierra la sesión del usuario e invalida el token.

| Propiedad   | Valor              |
| ----------- | ------------------ |
| **Método**  | `POST`             |
| **URL**     | `/auth/logout`     |
| **Auth**    | Bearer Token       |

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:** Ninguno

**Response Exitosa (200 OK):**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

**Errores Posibles:**

| Status | Código         | Mensaje                    |
| ------ | -------------- | -------------------------- |
| 400    | TOKEN_REQUIRED | Token es requerido         |
| 401    | INVALID_TOKEN  | Token inválido             |
| 500    | SERVER_ERROR   | Error interno del servidor |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

await authAPI.logout();
```

---

### 3. Refresh Token

Renueva el access token usando el refresh token.

| Propiedad   | Valor              |
| ----------- | ------------------ |
| **Método**  | `POST`             |
| **URL**     | `/auth/refresh`    |
| **Auth**    | No requerida       |

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Exitosa (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Errores Posibles:**

| Status | Código          | Mensaje                    |
| ------ | --------------- | -------------------------- |
| 401    | INVALID_TOKEN   | Refresh token inválido     |
| 401    | TOKEN_EXPIRED   | Refresh token expirado     |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

const response = await authAPI.refreshToken(refreshToken);
```

**Nota:** Este endpoint es llamado automáticamente por el interceptor de Axios cuando un access token expira.

---

### 4. Verificar Token

Verifica si el access token actual es válido.

| Propiedad   | Valor              |
| ----------- | ------------------ |
| **Método**  | `GET`              |
| **URL**     | `/auth/verify`     |
| **Auth**    | Bearer Token       |

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Exitosa (200 OK):**
```json
{
  "valid": true
}
```

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

const isValid = await authAPI.verifyToken(); // Retorna boolean
```

---

### 5. Obtener Usuario Actual

Obtiene los datos del usuario autenticado.

| Propiedad   | Valor              |
| ----------- | ------------------ |
| **Método**  | `GET`              |
| **URL**     | `/auth/me`         |
| **Auth**    | Bearer Token       |

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Exitosa (200 OK):**
```json
{
  "id_usuario": 1,
  "usuario": "admin",
  "nombre": "Juan",
  "paterno": "Perez",
  "materno": "Lopez",
  "nombre_completo": "Juan Perez Lopez",
  "expediente": "54321",
  "curp": "JUAN800101HDFRRN01",
  "correo": "juan.perez@metro.cdmx.gob.mx",
  "ing_perfil": "Administrador",
  "roles": ["ADMIN", "ROL_MEDICO"],
  "must_change_password": false
}
```

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

const user = await authAPI.getCurrentUser();
```

---

## Endpoints de Recuperación de Contraseña

El flujo de recuperación consta de 3 fases:

```
[Fase 1]              [Fase 2]              [Fase 3]
Solicitar Código  ->  Verificar OTP  ->  Nueva Contraseña
     |                     |                    |
     v                     v                    v
 email enviado        reset_token          contraseña
  con OTP              temporal            actualizada
```

---

### 6. Solicitar Código de Recuperación

Envía un código OTP al correo del usuario. **Fase 1 del flujo de recuperación.**

| Propiedad   | Valor                     |
| ----------- | ------------------------- |
| **Método**  | `POST`                    |
| **URL**     | `/auth/request-reset-code`|
| **Auth**    | No requerida              |

**Request Body:**
```json
{
  "email": "usuario@metro.cdmx.gob.mx"
}
```

**Response Exitosa (200 OK):**
```json
{
  "message": "Código enviado al correo"
}
```

**Errores Posibles:**

| Status | Código          | Mensaje                         |
| ------ | --------------- | ------------------------------- |
| 400    | INVALID_REQUEST | El email es requerido           |
| 404    | USER_NOT_FOUND  | No existe usuario con ese email |
| 500    | SERVER_ERROR    | Error interno del servidor      |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

await authAPI.requestResetCode({ email: "usuario@ejemplo.com" });
```

**Notas:**
- El código OTP tiene una duración limitada (típicamente 10 minutos)
- El código se almacena en Redis para validación posterior

---

### 7. Verificar Código OTP

Valida el código OTP y retorna un token temporal. **Fase 2 del flujo de recuperación.**

| Propiedad   | Valor                     |
| ----------- | ------------------------- |
| **Método**  | `POST`                    |
| **URL**     | `/auth/verify-reset-code` |
| **Auth**    | No requerida              |

**Request Body:**
```json
{
  "email": "usuario@metro.cdmx.gob.mx",
  "code": "123456"
}
```

**Response Exitosa (200 OK):**
```json
{
  "valid": true,
  "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores Posibles:**

| Status | Código          | Mensaje                       |
| ------ | --------------- | ----------------------------- |
| 400    | INVALID_REQUEST | Email y código son requeridos |
| 400    | INVALID_CODE    | Código inválido o expirado    |
| 500    | SERVER_ERROR    | Error interno del servidor    |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

const response = await authAPI.verifyResetCode({
  email: "usuario@ejemplo.com",
  code: "123456"
});

// Guardar reset_token para la siguiente fase
const resetToken = response.reset_token;
```

**Notas:**
- El `reset_token` tiene un claim `scope: "password_reset"`
- Este token tiene corta duración (típicamente 15 minutos)

---

### 8. Restablecer Contraseña

Cambia la contraseña usando el token temporal. **Fase 3 del flujo de recuperación.**

| Propiedad   | Valor                     |
| ----------- | ------------------------- |
| **Método**  | `POST`                    |
| **URL**     | `/auth/reset-password`    |
| **Auth**    | Bearer Token (reset_token)|

**Headers:**
```
Authorization: Bearer <reset_token>
```

**Request Body:**
```json
{
  "new_password": "NuevaContraseña123!"
}
```

**Response Exitosa (200 OK):**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

**Errores Posibles:**

| Status | Código          | Mensaje                                           |
| ------ | --------------- | ------------------------------------------------- |
| 400    | INVALID_REQUEST | La nueva contraseña es requerida                  |
| 401    | INVALID_TOKEN   | Identidad de usuario inválida en el token         |
| 403    | INVALID_SCOPE   | Token no autorizado para restablecer contraseña   |
| 500    | SERVER_ERROR    | Error interno del servidor                        |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

await authAPI.resetPassword({
  reset_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  new_password: "NuevaContraseña123!"
});
```

**Notas de Seguridad:**
- El token debe tener `scope: "password_reset"` para ser válido
- El backend extrae el `user_id` del JWT, no del body

---

## Endpoint de Onboarding

### 9. Completar Onboarding

Completa el primer inicio de sesión de un usuario nuevo.

| Propiedad   | Valor                        |
| ----------- | ---------------------------- |
| **Método**  | `POST`                       |
| **URL**     | `/auth/complete-onboarding`  |
| **Auth**    | No requerida (ver nota)      |

**Request Body:**
```json
{
  "id_usuario": 1,
  "new_password": "ContraseñaDefinitiva123!",
  "terms_accepted": true
}
```

**Response Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Onboarding completado",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id_usuario": 1,
    "usuario": "nuevo_usuario",
    "nombre_completo": "Usuario Nuevo",
    "must_change_password": false
  }
}
```

**Errores Posibles:**

| Status | Código           | Mensaje                        |
| ------ | ---------------- | ------------------------------ |
| 400    | INVALID_REQUEST  | El id_usuario es requerido     |
| 400    | ONBOARDING_ERROR | Error al completar onboarding  |
| 500    | SERVER_ERROR     | Error interno del servidor     |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

const response = await authAPI.completeOnboarding({
  new_password: "ContraseñaDefinitiva123!",
  terms_accepted: true
});
```

**Notas de Seguridad:**
> **Advertencia:** Actualmente este endpoint requiere `id_usuario` en el body.
> Se recomienda migrar a validación por token de sesión pre-autenticado
> para evitar manipulación del ID de usuario.

---

## Manejo de Errores

### Estructura de Error Estándar

```typescript
interface ApiError {
  code: string;      // Código único del error
  message: string;   // Mensaje para mostrar al usuario
  status: number;    // Código HTTP
}
```

### Catálogo de Errores

| Código               | Status | Descripción                                  |
| -------------------- | ------ | -------------------------------------------- |
| INVALID_REQUEST      | 400    | Faltan campos requeridos en el request       |
| INVALID_CODE         | 400    | Código OTP inválido o expirado               |
| INVALID_CREDENTIALS  | 401    | Usuario o contraseña incorrectos             |
| INVALID_TOKEN        | 401    | Token JWT inválido o malformado              |
| TOKEN_EXPIRED        | 401    | Token JWT ha expirado                        |
| TOKEN_REQUIRED       | 400    | No se proporcionó token de autenticación     |
| SESSION_EXPIRED      | 401    | Sesión expirada (fallo refresh token)        |
| INVALID_SCOPE        | 403    | Token no tiene el scope requerido            |
| USER_INACTIVE        | 403    | Usuario deshabilitado administrativamente    |
| USER_NOT_FOUND       | 404    | Usuario no existe en el sistema              |
| USER_LOCKED          | 423    | Usuario bloqueado por intentos fallidos      |
| TOO_MANY_REQUESTS    | 429    | Rate limit excedido (esperar antes de reintentar) |
| IP_BLOCKED           | 403    | IP bloqueada por múltiples intentos fallidos |
| ONBOARDING_ERROR     | 400    | Error en el proceso de onboarding            |
| SERVER_ERROR         | 500    | Error interno del servidor                   |
| UNKNOWN_ERROR        | 500    | Error no identificado                        |

### Ejemplo de Manejo en Frontend

```typescript
import { authAPI } from "@api/resources/auth.api";
import { toast } from "sonner";

try {
  const response = await authAPI.login({ usuario, clave });
  // Éxito...
} catch (error) {
  const apiError = error as ApiError;
  
  switch (apiError.code) {
    case "INVALID_CREDENTIALS":
      toast.error("Usuario o contraseña incorrectos");
      break;
    case "USER_LOCKED":
      toast.error("Tu cuenta está bloqueada. Intenta más tarde.");
      break;
    case "USER_INACTIVE":
      toast.error("Tu cuenta ha sido deshabilitada.");
      break;
    default:
      toast.error(apiError.message || "Error inesperado");
  }
}
```

---

## Referencia Rápida de Endpoints

| Método | Endpoint                   | Auth     | Descripción                       |
| ------ | -------------------------- | -------- | --------------------------------- |
| POST   | `/auth/login`              | No       | Iniciar sesión                    |
| POST   | `/auth/logout`             | Bearer   | Cerrar sesión                     |
| POST   | `/auth/refresh`            | No       | Renovar access token              |
| GET    | `/auth/verify`             | Bearer   | Verificar token válido            |
| GET    | `/auth/me`                 | Bearer   | Obtener usuario actual            |
| POST   | `/auth/request-reset-code` | No       | Solicitar código OTP              |
| POST   | `/auth/verify-reset-code`  | No       | Verificar código OTP              |
| POST   | `/auth/reset-password`     | Bearer*  | Cambiar contraseña (*reset_token) |
| POST   | `/auth/complete-onboarding`| No       | Completar primer login            |

---

**Ver también:**
- [Arquitectura de Autenticación](../architecture/authentication.md) - Flujos high-level y cookies HttpOnly
- [API Endpoints](./endpoints.md) - Referencia general de todos los endpoints

**Última actualización:** Enero 2026
