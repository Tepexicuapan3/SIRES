# SIRES API Documentation - Auth Module

Esta documentacion detalla los contratos de comunicacion entre el Frontend y el Backend para el modulo de Autenticacion del Sistema Integral de Registros de Expedientes de Salud (SIRES).

---

## Indice

1. [Arquitectura General](#arquitectura-general)
2. [Cliente HTTP (Axios)](#cliente-http-axios)
3. [Estandares de Respuesta](#estandares-de-respuesta)
4. [Tipos TypeScript](#tipos-typescript)
5. [Endpoints de Autenticacion](#endpoints-de-autenticacion)
   - [Login](#1-login-de-usuario)
   - [Logout](#2-logout-de-usuario)
   - [Refresh Token](#3-refresh-token)
   - [Verificar Token](#4-verificar-token)
   - [Obtener Usuario Actual](#5-obtener-usuario-actual)
6. [Endpoints de Recuperacion de Contrasena](#endpoints-de-recuperacion-de-contrasena)
   - [Solicitar Codigo](#6-solicitar-codigo-de-recuperacion)
   - [Verificar Codigo OTP](#7-verificar-codigo-otp)
   - [Restablecer Contrasena](#8-restablecer-contrasena)
7. [Endpoint de Onboarding](#endpoint-de-onboarding)
   - [Completar Onboarding](#9-completar-onboarding)
8. [Sistema de Mocks](#sistema-de-mocks)
9. [Manejo de Errores](#manejo-de-errores)
10. [Flujos de Usuario](#flujos-de-usuario)
11. [Seguridad](#consideraciones-de-seguridad)

---

## Arquitectura General

```
frontend/src/api/
|-- client.ts           # Cliente Axios configurado con interceptores
|-- README.md           # Esta documentacion
|-- mocks/
|   |-- auth.mocks.ts   # Implementacion mock para desarrollo sin backend
|-- resources/
|   |-- auth.api.ts     # Funciones de llamada a endpoints de autenticacion
|-- types/
    |-- auth.types.ts   # Interfaces TypeScript para request/response
```

### Patron de Diseno

El modulo utiliza el patron **Strategy** para alternar entre la API real y mocks:

```typescript
// auth.api.ts
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
export const authAPI = USE_MOCKS ? authMocks : realAuthAPI;
```

---

## Cliente HTTP (Axios)

**Archivo:** `client.ts`

### Configuracion Base

| Propiedad      | Valor                          |
| -------------- | ------------------------------ |
| Base URL       | `env.apiUrl` (variable .env)   |
| Timeout        | 30,000 ms (30 segundos)        |
| Content-Type   | `application/json`             |
| Accept         | `application/json`             |

### Interceptor de Request

El cliente automaticamente agrega el token JWT a todas las peticiones:

```typescript
// Se ejecuta antes de cada peticion
if (token && config.headers) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

**Excepcion:** Si el header `Authorization` ya esta configurado manualmente, no se sobreescribe.

### Interceptor de Response

Maneja errores globales y renovacion automatica de tokens:

| Escenario                     | Accion                                          |
| ----------------------------- | ----------------------------------------------- |
| Error 401 en `/auth/login`    | Rechaza sin reintentar                          |
| Error 401 en `/auth/logout`   | Rechaza sin reintentar                          |
| Error 401 (otros endpoints)   | Intenta renovar token via `/auth/refresh`       |
| Renovacion exitosa            | Reintenta la peticion original                  |
| Renovacion fallida            | Limpia localStorage, redirige a `/login?expired=true` |

### Estructura de Error Normalizada

Todos los errores se transforman a este formato:

```typescript
interface ApiError {
  code: string;      // Codigo de error del backend o "UNKNOWN_ERROR"
  message: string;   // Mensaje legible para el usuario
  status: number;    // Codigo HTTP (401, 403, 500, etc.)
}
```

---

## Estandares de Respuesta

### Respuesta Exitosa (2xx)

```json
{
  "data": "...",
  "message": "Operacion exitosa"
}
```

### Respuesta de Error (4xx, 5xx)

```json
{
  "code": "STRING_CODE",
  "message": "Mensaje legible para el usuario"
}
```

### Codigos de Estado HTTP

| Codigo | Nombre                | Descripcion                                    |
| ------ | --------------------- | ---------------------------------------------- |
| 200    | OK                    | Peticion exitosa                               |
| 400    | Bad Request           | Datos invalidos o faltantes en el request      |
| 401    | Unauthorized          | Token invalido, expirado o credenciales erroneas |
| 403    | Forbidden             | Usuario inactivo o sin permisos                |
| 404    | Not Found             | Recurso no encontrado (ej: usuario no existe)  |
| 423    | Locked                | Usuario bloqueado por multiples intentos       |
| 500    | Internal Server Error | Error no controlado en el servidor             |

---

## Tipos TypeScript

**Archivo:** `types/auth.types.ts`

### Tipos de Request

#### LoginRequest
```typescript
interface LoginRequest {
  usuario: string;  // Nombre de usuario (ej: "admin")
  clave: string;    // Contrasena en texto plano
}
```

#### RefreshTokenRequest
```typescript
interface RefreshTokenRequest {
  refresh_token: string;  // Token de renovacion
}
```

#### RequestResetCodeRequest
```typescript
interface RequestResetCodeRequest {
  email: string;  // Correo electronico del usuario
}
```

#### VerifyResetCodeRequest
```typescript
interface VerifyResetCodeRequest {
  email: string;  // Correo electronico
  code: string;   // Codigo OTP de 6 digitos
}
```

#### ResetPasswordRequest
```typescript
interface ResetPasswordRequest {
  reset_token: string;   // Token temporal de restablecimiento
  new_password: string;  // Nueva contrasena
}
```

#### CompleteOnboardingRequest
```typescript
interface CompleteOnboardingRequest {
  new_password: string;     // Nueva contrasena definitiva
  terms_accepted: boolean;  // Aceptacion de terminos y condiciones
}
```

### Tipos de Response

#### Usuario
```typescript
interface Usuario {
  id_usuario: number;          // ID unico del usuario
  usuario: string;             // Nombre de usuario
  nombre: string;              // Nombre(s)
  paterno: string;             // Apellido paterno
  materno: string;             // Apellido materno
  nombre_completo: string;     // Nombre completo (computed)
  expediente: string;          // Numero de expediente
  curp: string;                // CURP del usuario
  correo: string;              // Correo electronico
  ing_perfil: string;          // Perfil de ingreso
  roles: string[];             // Lista de roles ['ADMIN', 'ROL_MEDICO']
  permisos?: string[];         // Permisos especificos (opcional)
  must_change_password: boolean; // Indica si requiere cambiar contrasena
}
```

#### LoginResponse
```typescript
interface LoginResponse {
  access_token: string;    // JWT de acceso
  refresh_token: string;   // JWT de renovacion
  token_type: "Bearer";    // Tipo de token (siempre "Bearer")
  expires_in: number;      // Segundos hasta expiracion (ej: 3600)
  user: Usuario;           // Datos del usuario autenticado
}
```

#### RefreshTokenResponse
```typescript
interface RefreshTokenResponse {
  access_token: string;    // Nuevo JWT de acceso
  token_type: "Bearer";    // Tipo de token
  expires_in: number;      // Segundos hasta expiracion
}
```

#### VerifyResetCodeResponse
```typescript
interface VerifyResetCodeResponse {
  valid: boolean;       // Si el codigo es valido
  reset_token: string;  // Token temporal para cambiar contrasena
}
```

### Tipos de Estado (Store)

#### AuthState
```typescript
interface AuthState {
  user: Usuario | null;        // Usuario actual
  token: string | null;        // Access token
  refreshToken: string | null; // Refresh token
  isAuthenticated: boolean;    // Estado de autenticacion
  isLoading: boolean;          // Indicador de carga
}
```

---

## Endpoints de Autenticacion

### 1. Login de Usuario

Autentica un usuario con sus credenciales.

| Propiedad   | Valor              |
| ----------- | ------------------ |
| **Metodo**  | `POST`             |
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

| Status | Codigo              | Mensaje                                       |
| ------ | ------------------- | --------------------------------------------- |
| 400    | INVALID_REQUEST     | Usuario y contrasena son requeridos           |
| 401    | INVALID_CREDENTIALS | Usuario o contrasena incorrectos              |
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

Cierra la sesion del usuario e invalida el token.

| Propiedad   | Valor              |
| ----------- | ------------------ |
| **Metodo**  | `POST`             |
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
  "message": "Sesion cerrada correctamente"
}
```

**Errores Posibles:**

| Status | Codigo         | Mensaje                    |
| ------ | -------------- | -------------------------- |
| 400    | TOKEN_REQUIRED | Token es requerido         |
| 401    | INVALID_TOKEN  | Token invalido             |
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
| **Metodo**  | `POST`             |
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

| Status | Codigo          | Mensaje                    |
| ------ | --------------- | -------------------------- |
| 401    | INVALID_TOKEN   | Refresh token invalido     |
| 401    | TOKEN_EXPIRED   | Refresh token expirado     |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

const response = await authAPI.refreshToken(refreshToken);
```

**Nota:** Este endpoint es llamado automaticamente por el interceptor de Axios cuando un access token expira.

---

### 4. Verificar Token

Verifica si el access token actual es valido.

| Propiedad   | Valor              |
| ----------- | ------------------ |
| **Metodo**  | `GET`              |
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
| **Metodo**  | `GET`              |
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

## Endpoints de Recuperacion de Contrasena

El flujo de recuperacion consta de 3 fases:

```
[Fase 1]              [Fase 2]              [Fase 3]
Solicitar Codigo  ->  Verificar OTP  ->  Nueva Contrasena
     |                     |                    |
     v                     v                    v
 email enviado        reset_token          contrasena
  con OTP              temporal            actualizada
```

---

### 6. Solicitar Codigo de Recuperacion

Envia un codigo OTP al correo del usuario. **Fase 1 del flujo de recuperacion.**

| Propiedad   | Valor                     |
| ----------- | ------------------------- |
| **Metodo**  | `POST`                    |
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
  "message": "Codigo enviado al correo"
}
```

**Errores Posibles:**

| Status | Codigo          | Mensaje                         |
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
- El codigo OTP tiene una duracion limitada (tipicamente 10 minutos)
- El codigo se almacena en Redis para validacion posterior

---

### 7. Verificar Codigo OTP

Valida el codigo OTP y retorna un token temporal. **Fase 2 del flujo de recuperacion.**

| Propiedad   | Valor                     |
| ----------- | ------------------------- |
| **Metodo**  | `POST`                    |
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

| Status | Codigo          | Mensaje                       |
| ------ | --------------- | ----------------------------- |
| 400    | INVALID_REQUEST | Email y codigo son requeridos |
| 400    | INVALID_CODE    | Codigo invalido o expirado    |
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
- Este token tiene corta duracion (tipicamente 15 minutos)

---

### 8. Restablecer Contrasena

Cambia la contrasena usando el token temporal. **Fase 3 del flujo de recuperacion.**

| Propiedad   | Valor                     |
| ----------- | ------------------------- |
| **Metodo**  | `POST`                    |
| **URL**     | `/auth/reset-password`    |
| **Auth**    | Bearer Token (reset_token)|

**Headers:**
```
Authorization: Bearer <reset_token>
```

**Request Body:**
```json
{
  "new_password": "NuevaContrasena123!"
}
```

**Response Exitosa (200 OK):**
```json
{
  "message": "Contrasena actualizada correctamente"
}
```

**Errores Posibles:**

| Status | Codigo          | Mensaje                                           |
| ------ | --------------- | ------------------------------------------------- |
| 400    | INVALID_REQUEST | La nueva contrasena es requerida                  |
| 401    | INVALID_TOKEN   | Identidad de usuario invalida en el token         |
| 403    | INVALID_SCOPE   | Token no autorizado para restablecer contrasena   |
| 500    | SERVER_ERROR    | Error interno del servidor                        |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

await authAPI.resetPassword({
  reset_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  new_password: "NuevaContrasena123!"
});
```

**Notas de Seguridad:**
- El token debe tener `scope: "password_reset"` para ser valido
- El backend extrae el `user_id` del JWT, no del body

---

## Endpoint de Onboarding

### 9. Completar Onboarding

Completa el primer inicio de sesion de un usuario nuevo.

| Propiedad   | Valor                        |
| ----------- | ---------------------------- |
| **Metodo**  | `POST`                       |
| **URL**     | `/auth/complete-onboarding`  |
| **Auth**    | No requerida (ver nota)      |

**Request Body:**
```json
{
  "id_usuario": 1,
  "new_password": "ContrasenaDefinitiva123!",
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

| Status | Codigo           | Mensaje                        |
| ------ | ---------------- | ------------------------------ |
| 400    | INVALID_REQUEST  | El id_usuario es requerido     |
| 400    | ONBOARDING_ERROR | Error al completar onboarding  |
| 500    | SERVER_ERROR     | Error interno del servidor     |

**Uso en Frontend:**
```typescript
import { authAPI } from "@api/resources/auth.api";

const response = await authAPI.completeOnboarding({
  new_password: "ContrasenaDefinitiva123!",
  terms_accepted: true
});
```

**Notas de Seguridad:**
> **Advertencia:** Actualmente este endpoint requiere `id_usuario` en el body.
> Se recomienda migrar a validacion por token de sesion pre-autenticado
> para evitar manipulacion del ID de usuario.

---

## Sistema de Mocks

**Archivo:** `mocks/auth.mocks.ts`

El sistema de mocks permite desarrollar el frontend sin conexion al backend.

### Activacion

```bash
# En .env.local
VITE_USE_MOCKS=true
```

### Usuarios de Prueba - Login

| Usuario        | Contrasena | Comportamiento                              |
| -------------- | ---------- | ------------------------------------------- |
| `admin`        | cualquiera | Login exitoso con rol ADMIN                 |
| `medico`       | cualquiera | Login exitoso con rol MEDICO                |
| `enfermero`    | cualquiera | Login exitoso con rol ENFERMERO             |
| `nuevo`        | cualquiera | Login exitoso + requiere Onboarding         |
| `inactivo`     | cualquiera | Error 403 USER_INACTIVE                     |
| `noexiste`     | cualquiera | Error 404 USER_NOT_FOUND                    |
| `error`        | cualquiera | Error 401 INVALID_CREDENTIALS               |
| cualquiera     | `mal`      | Error 401 INVALID_CREDENTIALS               |
| `fail`         | cualquiera | Error 500 INTERNAL_SERVER_ERROR             |

### Usuarios de Prueba - Rate Limiting

| Usuario        | Comportamiento                                      |
| -------------- | --------------------------------------------------- |
| `bloqueado`    | Error 423 USER_LOCKED (retry_after: 5 min)          |
| `bloqueado1h`  | Error 423 USER_LOCKED (retry_after: 1 hora)         |
| `bloqueado24h` | Error 423 USER_LOCKED (retry_after: 24 horas)       |
| `ratelimit`    | Error 429 TOO_MANY_REQUESTS (retry_after: 1 min)    |
| `ratelimit5`   | Error 429 TOO_MANY_REQUESTS (retry_after: 5 min)    |
| `ipblock`      | Error 403 IP_BLOCKED (retry_after: 15 min)          |
| `ipblock1h`    | Error 403 IP_BLOCKED (retry_after: 1 hora)          |
| `ipblock24h`   | Error 403 IP_BLOCKED (retry_after: 24 horas)        |

### Codigos OTP de Prueba

| Codigo    | Resultado                                         |
| --------- | ------------------------------------------------- |
| `123456`  | Verificacion exitosa                              |
| `000000`  | Error 400 CODE_EXPIRED (codigo expirado)          |
| `999999`  | Error 429 TOO_MANY_REQUESTS (muchos intentos)     |
| otro      | Error 400 INVALID_CODE                            |

### Delays Simulados

| Operacion             | Delay   |
| --------------------- | ------- |
| Login                 | 1500ms  |
| Complete Onboarding   | 1500ms  |
| Logout                | 1000ms  |
| Refresh Token         | 1000ms  |
| Get Current User      | 1000ms  |
| Verify Token          | 500ms   |
| Request Reset Code    | 1000ms  |
| Verify Reset Code     | 1000ms  |
| Reset Password        | 1500ms  |

---

## Manejo de Errores

### Estructura de Error Estandar

```typescript
interface ApiError {
  code: string;      // Codigo unico del error
  message: string;   // Mensaje para mostrar al usuario
  status: number;    // Codigo HTTP
}
```

### Catalogo de Errores

| Codigo               | Status | Descripcion                                  |
| -------------------- | ------ | -------------------------------------------- |
| INVALID_REQUEST      | 400    | Faltan campos requeridos en el request       |
| INVALID_CODE         | 400    | Codigo OTP invalido o expirado               |
| INVALID_CREDENTIALS  | 401    | Usuario o contrasena incorrectos             |
| INVALID_TOKEN        | 401    | Token JWT invalido o malformado              |
| TOKEN_EXPIRED        | 401    | Token JWT ha expirado                        |
| TOKEN_REQUIRED       | 400    | No se proporciono token de autenticacion     |
| SESSION_EXPIRED      | 401    | Sesion expirada (fallo refresh token)        |
| INVALID_SCOPE        | 403    | Token no tiene el scope requerido            |
| USER_INACTIVE        | 403    | Usuario deshabilitado administrativamente    |
| USER_NOT_FOUND       | 404    | Usuario no existe en el sistema              |
| USER_LOCKED          | 423    | Usuario bloqueado por intentos fallidos      |
| TOO_MANY_REQUESTS    | 429    | Rate limit excedido (esperar antes de reintentar) |
| IP_BLOCKED           | 403    | IP bloqueada por multiples intentos fallidos |
| ONBOARDING_ERROR     | 400    | Error en el proceso de onboarding            |
| SERVER_ERROR         | 500    | Error interno del servidor                   |
| UNKNOWN_ERROR        | 500    | Error no identificado                        |

### Ejemplo de Manejo en Frontend

```typescript
import { authAPI } from "@api/resources/auth.api";
import { toast } from "sonner";

try {
  const response = await authAPI.login({ usuario, clave });
  // Exito...
} catch (error) {
  const apiError = error as ApiError;
  
  switch (apiError.code) {
    case "INVALID_CREDENTIALS":
      toast.error("Usuario o contrasena incorrectos");
      break;
    case "USER_LOCKED":
      toast.error("Tu cuenta esta bloqueada. Intenta mas tarde.");
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

## Flujos de Usuario

### Flujo 1: Login Normal

```
Usuario                    Frontend                    Backend
  |                           |                           |
  |-- Ingresa credenciales -->|                           |
  |                           |-- POST /auth/login ------>|
  |                           |                           |
  |                           |<-- 200 OK + tokens -------|
  |                           |                           |
  |                           |-- Guarda en localStorage  |
  |                           |-- Actualiza authStore     |
  |<-- Redirige a Dashboard --|                           |
```

### Flujo 2: Login con Onboarding

```
Usuario                    Frontend                    Backend
  |                           |                           |
  |-- Ingresa credenciales -->|                           |
  |                           |-- POST /auth/login ------>|
  |                           |                           |
  |                           |<-- 200 + must_change=true-|
  |                           |                           |
  |<-- Redirige a Onboarding -|                           |
  |                           |                           |
  |-- Nueva password + T&C -->|                           |
  |                           |-- POST /complete-onboard->|
  |                           |                           |
  |                           |<-- 200 OK + new tokens ---|
  |<-- Redirige a Dashboard --|                           |
```

### Flujo 3: Recuperacion de Contrasena

```
Usuario                    Frontend                    Backend
  |                           |                           |
  |-- Ingresa email --------->|                           |
  |                           |-- POST /request-reset --->|
  |                           |<-- 200 OK ----------------|
  |<-- "Codigo enviado" ------|                           |
  |                           |                           |
  |-- Ingresa codigo OTP ---->|                           |
  |                           |-- POST /verify-reset ---->|
  |                           |<-- 200 + reset_token -----|
  |                           |                           |
  |-- Nueva contrasena ------>|                           |
  |                           |-- POST /reset-password -->|
  |                           |   (con reset_token)       |
  |                           |<-- 200 OK ----------------|
  |<-- Redirige a Login ------|                           |
```

### Flujo 4: Token Refresh Automatico

```
Frontend                    Backend
  |                           |
  |-- GET /some-endpoint ---->|
  |<-- 401 Token Expired -----|
  |                           |
  |-- POST /auth/refresh ---->|
  |   (con refresh_token)     |
  |<-- 200 + new access_token-|
  |                           |
  |-- GET /some-endpoint ---->|
  |   (con nuevo token)       |
  |<-- 200 OK + data ---------|
```

---

## Rate Limiting y Proteccion DDoS

### Arquitectura de Seguridad

> **IMPORTANTE:** La proteccion contra ataques de fuerza bruta y DDoS se implementa
> **EXCLUSIVAMENTE en el backend** usando Redis. El frontend NO implementa bloqueos
> locales porque serian triviales de evadir (borrar localStorage, usar cURL, etc.)

El backend implementa un sistema de defensa en 3 capas:

```
┌─────────────────────────────────────────────────────────────┐
│           CAPA 1: Rate Limit por IP (Sliding Window)        │
│                   10 requests/minuto a /auth/login          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│           CAPA 2: Bloqueo por IP (Intentos Fallidos)        │
│     15 fails = 15min │ 30 fails = 1h │ 50 fails = 24h       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│           CAPA 3: Bloqueo por Usuario (Intentos Fallidos)   │
│   5 fails = 5min │ 10 fails = 15min │ 15 fails = 1h         │
└─────────────────────────────────────────────────────────────┘
```

### Errores de Rate Limiting

| Status | Codigo            | Cuando ocurre                              | Accion del Frontend |
|--------|-------------------|--------------------------------------------|--------------------|
| 429    | TOO_MANY_REQUESTS | Mas de 10 requests/min desde la misma IP   | Mostrar mensaje, esperar |
| 403    | IP_BLOCKED        | IP bloqueada por muchos intentos fallidos  | Mostrar mensaje, esperar |
| 423    | USER_LOCKED       | Usuario bloqueado por intentos fallidos    | Mostrar mensaje, esperar |

### Respuesta con Tiempo de Espera

Cuando el backend bloquea una solicitud, incluye el tiempo restante:

```json
{
  "code": "TOO_MANY_REQUESTS",
  "message": "Demasiadas solicitudes. Intenta en un minuto.",
  "retry_after": 60
}
```

### Manejo en Frontend

```typescript
// El frontend solo muestra el mensaje del backend
// NO implementa contadores locales (serian inseguros)

const messages: Record<string, string> = {
  TOO_MANY_REQUESTS: "Demasiados intentos. Espera unos minutos.",
  IP_BLOCKED: "Tu IP ha sido bloqueada temporalmente",
  USER_LOCKED: "Cuenta bloqueada temporalmente por seguridad",
  // ... otros errores
};

toast.error("Error de autenticacion", {
  description: messages[errorCode] || errorMessage,
});
```

### Documentacion Tecnica del Backend

Para detalles de implementacion del rate limiting con Redis, ver:
`backend/docs/RATE_LIMITING.md`

---

## Consideraciones de Seguridad

### Almacenamiento de Tokens

| Token         | Almacenamiento      | Expiracion Tipica |
| ------------- | ------------------- | ----------------- |
| access_token  | localStorage        | 1 hora            |
| refresh_token | localStorage        | 7 dias            |
| reset_token   | Variable en memoria | 15 minutos        |

> **Nota:** El almacenamiento en localStorage es vulnerable a XSS.
> Para mayor seguridad, considerar migrar a httpOnly cookies.

### Validaciones del Backend

1. **Login:**
   - Hasheo de contrasenas con algoritmo seguro
   - Rate limiting por IP
   - Bloqueo temporal despues de N intentos fallidos

2. **Reset Password:**
   - Token con scope especifico (`password_reset`)
   - Expiracion corta del OTP (10 min)
   - Invalidacion del OTP despues de uso

3. **Onboarding:**
   - Requiere `terms_accepted: true`
   - Actualiza `must_change_password` a `false`

### Headers de Seguridad Recomendados

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## Apendice: Referencia Rapida de Endpoints

| Metodo | Endpoint                   | Auth     | Descripcion                       |
| ------ | -------------------------- | -------- | --------------------------------- |
| POST   | `/auth/login`              | No       | Iniciar sesion                    |
| POST   | `/auth/logout`             | Bearer   | Cerrar sesion                     |
| POST   | `/auth/refresh`            | No       | Renovar access token              |
| GET    | `/auth/verify`             | Bearer   | Verificar token valido            |
| GET    | `/auth/me`                 | Bearer   | Obtener usuario actual            |
| POST   | `/auth/request-reset-code` | No       | Solicitar codigo OTP              |
| POST   | `/auth/verify-reset-code`  | No       | Verificar codigo OTP              |
| POST   | `/auth/reset-password`     | Bearer*  | Cambiar contrasena (*reset_token) |
| POST   | `/auth/complete-onboarding`| No       | Completar primer login            |

---

*Documentacion generada para SIRES v1.0*
*Ultima actualizacion: Diciembre 2024*
