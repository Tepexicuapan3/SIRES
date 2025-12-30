# Guía de Testing con Mocks - SIRES

> **Última actualización:** Sistema RBAC 2.0 - Incluye permisos granulares

---

## 🎭 Cómo Activar los Mocks

Los mocks están configurados en `frontend/src/api/client.ts`. Para activarlos:

```typescript
// frontend/src/api/client.ts

// MODO MOCK (para desarrollo sin backend)
const USE_MOCKS = true; // Cambiar a true

// MODO REAL (conecta al backend)
const USE_MOCKS = false; // Cambiar a false
```

---

## 👥 Usuarios de Prueba Disponibles

### 1. Admin (Acceso Total)

```
Usuario: admin
Contraseña: cualquiera
```

**Características RBAC 2.0:**
- ✅ `permissions: ["*"]` → Wildcard (todos los permisos)
- ✅ `landing_route: "/admin"` → Redirige a panel de administración
- ✅ `is_admin: true` → Bypass de verificación de permisos
- ✅ Roles: `["ADMIN", "ROL_MEDICO"]`

**Permisos efectivos:**
- Puede crear, leer, actualizar y eliminar TODO
- Acceso a gestión de usuarios
- Acceso a configuración del sistema

---

### 2. Médico (Permisos Completos Clínicos)

```
Usuario: medico
Contraseña: cualquiera
```

**Características RBAC 2.0:**
- ✅ `permissions`: 
  - `expedientes:create`, `expedientes:read`, `expedientes:update`, `expedientes:delete`
  - `consultas:create`, `consultas:read`, `consultas:update`
  - `pacientes:read`, `pacientes:update`
- ✅ `landing_route: "/consultas"` → Redirige a módulo de consultas
- ✅ `is_admin: false`
- ✅ Roles: `["ROL_MEDICO"]`

**Permisos efectivos:**
- ✅ Puede crear/modificar/eliminar expedientes
- ✅ Puede crear/modificar consultas
- ✅ Puede ver/actualizar datos de pacientes
- ❌ NO puede gestionar usuarios
- ❌ NO puede acceder a /admin

---

### 3. Enfermero (Permisos Limitados Clínicos)

```
Usuario: enfermero
Contraseña: cualquiera
```

**Características RBAC 2.0:**
- ✅ `permissions`:
  - `expedientes:read`
  - `consultas:create`, `consultas:read`, `consultas:update`
  - `pacientes:read`
- ✅ `landing_route: "/dashboard"` → Redirige a dashboard general
- ✅ `is_admin: false`
- ✅ Roles: `["ROL_ENFERMERO"]`

**Permisos efectivos:**
- ✅ Puede VER expedientes (solo lectura)
- ✅ Puede crear/modificar consultas
- ✅ Puede ver datos de pacientes
- ❌ NO puede crear/eliminar expedientes
- ❌ NO puede modificar datos de pacientes
- ❌ NO puede acceder a /admin

---

### 4. Usuario Genérico (Solo Lectura)

```
Usuario: usuario
Contraseña: cualquiera
```

**Características RBAC 2.0:**
- ✅ `permissions`:
  - `expedientes:read`
  - `consultas:read`
  - `pacientes:read`
- ✅ `landing_route: "/dashboard"`
- ✅ `is_admin: false`
- ✅ Roles: `["ROL_USUARIO"]`

**Permisos efectivos:**
- ✅ Puede VER expedientes, consultas y pacientes
- ❌ NO puede crear/modificar/eliminar NADA
- ❌ Todos los botones de acción deberían estar ocultos/deshabilitados

---

### 5. Usuario Nuevo (Onboarding Requerido)

```
Usuario: nuevo
Contraseña: cualquiera
```

**Características RBAC 2.0:**
- ✅ `permissions: []` → Sin permisos hasta completar onboarding
- ✅ `landing_route: "/onboarding"` → Forzado a onboarding
- ✅ `is_admin: false`
- ✅ `must_change_password: true` → Activa flujo de onboarding
- ✅ Roles: `[]` → Sin roles asignados

**Flujo esperado:**
1. Login exitoso pero con flag `must_change_password: true`
2. Redirige automáticamente a `/onboarding`
3. Usuario DEBE aceptar términos y cambiar contraseña
4. Después de onboarding, se asignan permisos de médico

---

## ❌ Usuarios de Error (Testing de Manejo de Errores)

### Errores de Autenticación

| Usuario      | Contraseña  | Código Error            | Status | Descripción                          |
|--------------|-------------|-------------------------|--------|--------------------------------------|
| `inactivo`   | cualquiera  | `USER_INACTIVE`         | 403    | Usuario deshabilitado                |
| `noexiste`   | cualquiera  | `USER_NOT_FOUND`        | 404    | Usuario inexistente                  |
| `error`      | cualquiera  | `INVALID_CREDENTIALS`   | 401    | Credenciales inválidas               |
| cualquiera   | `mal`       | `INVALID_CREDENTIALS`   | 401    | Contraseña incorrecta                |
| `fail`       | cualquiera  | `INTERNAL_SERVER_ERROR` | 500    | Simula error de BD                   |

---

### Errores de Rate Limiting (con `retry_after`)

| Usuario         | Código Error        | Status | Retry After | Descripción                          |
|-----------------|---------------------|--------|-------------|--------------------------------------|
| `bloqueado`     | `USER_LOCKED`       | 423    | 300s (5m)   | Usuario bloqueado por intentos       |
| `bloqueado1h`   | `USER_LOCKED`       | 423    | 3600s (1h)  | Usuario bloqueado 1 hora             |
| `bloqueado24h`  | `USER_LOCKED`       | 423    | 86400s (24h)| Usuario bloqueado 24 horas           |
| `ratelimit`     | `TOO_MANY_REQUESTS` | 429    | 60s (1m)    | Rate limit por IP - corto            |
| `ratelimit5`    | `TOO_MANY_REQUESTS` | 429    | 300s (5m)   | Rate limit por IP - medio            |
| `ipblock`       | `IP_BLOCKED`        | 403    | 900s (15m)  | IP bloqueada - corto                 |
| `ipblock1h`     | `IP_BLOCKED`        | 403    | 3600s (1h)  | IP bloqueada - medio                 |
| `ipblock24h`    | `IP_BLOCKED`        | 403    | 86400s (24h)| IP bloqueada - permanente            |

**Comportamiento esperado:**
- Toast de error con mensaje descriptivo
- Mostrar tiempo de bloqueo en formato legible (ej: "5 minutos")
- En dev mode: log en consola con `retry_after` en segundos

---

## 🔐 Contraseñas de Prueba (Onboarding y Recovery)

Estas contraseñas aplican tanto para **onboarding** como para **reset password**.

### Errores de Validación de Contraseña

| Contraseña       | Código Error            | Status | Descripción                          |
|------------------|-------------------------|--------|--------------------------------------|
| `Corta1@`        | `PASSWORD_TOO_SHORT`    | 400    | Menos de 8 caracteres                |
| `sinmayuscula1@` | `PASSWORD_NO_UPPERCASE` | 400    | Falta letra mayúscula                |
| `SinNumero@`     | `PASSWORD_NO_NUMBER`    | 400    | Falta número                         |
| `SinEspecial1`   | `PASSWORD_NO_SPECIAL`   | 400    | Falta carácter especial              |
| `Expirado1@`     | `INVALID_SCOPE`         | 403    | Token de onboarding/recovery expirado|
| `YaActivo1@`     | `ONBOARDING_NOT_REQUIRED` | 400  | Solo onboarding: ya completado       |

### Contraseña Válida

```
Cualquier contraseña que cumpla:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 número
- Al menos 1 carácter especial (!@#$%^&*...)

Ejemplo: Sires2025!
```

---

## 🔑 Códigos OTP (Recovery Password)

### Flujo de Recovery:

1. **Solicitar código:**
   - Email: `cualquier_email@metro.cdmx.gob.mx`
   - Resultado: ✅ Éxito (revisa consola para el código)

2. **Verificar código:**

| Código  | Resultado                                      |
|---------|------------------------------------------------|
| `123456`| ✅ Código válido - avanza a cambio de password |
| `000000`| ❌ `CODE_EXPIRED` - código expirado            |
| `999999`| ❌ `TOO_MANY_REQUESTS` - demasiados intentos   |
| otro    | ❌ `INVALID_CODE` - código incorrecto          |

3. **Cambiar contraseña:**
   - Usar las mismas reglas de validación de arriba

---

## 🧪 Casos de Prueba Recomendados

### Testing de RBAC 2.0

#### Test 1: Admin tiene acceso total
1. Login con `admin` / cualquiera
2. Verificar redirección a `/admin`
3. Intentar acceder a cualquier ruta protegida → ✅ Debería permitir
4. Verificar que botones de acciones peligrosas estén visibles (crear/eliminar usuarios)

#### Test 2: Médico tiene permisos clínicos
1. Login con `medico` / cualquiera
2. Verificar redirección a `/consultas`
3. Intentar acceder a `/admin` → ❌ Debería denegar (mensaje "Acceso Denegado")
4. Verificar que puede crear/editar expedientes
5. Verificar que NO puede gestionar usuarios

#### Test 3: Enfermero tiene permisos limitados
1. Login con `enfermero` / cualquiera
2. Verificar redirección a `/dashboard`
3. Abrir un expediente → ✅ Puede VER
4. Intentar EDITAR expediente → ❌ Botón de editar NO debería aparecer
5. Intentar crear consulta → ✅ Debería permitir

#### Test 4: Usuario genérico solo lectura
1. Login con `usuario` / cualquiera
2. Verificar que TODOS los botones de acción estén deshabilitados/ocultos
3. Verificar que puede navegar y VER contenido
4. Intentar cualquier modificación → ❌ UI debería prevenirlo

#### Test 5: Onboarding obligatorio
1. Login con `nuevo` / cualquiera
2. Verificar redirección FORZADA a `/onboarding`
3. Intentar navegar a otra ruta → ❌ Debería redirigir de vuelta a onboarding
4. Completar onboarding con contraseña válida
5. Verificar que después del onboarding se asignan permisos

---

### Testing de Errores y Rate Limiting

#### Test 6: Manejo de credenciales inválidas
1. Login con `error` / cualquiera → Toast de error, sin redirección
2. Login con `admin` / `mal` → Mismo comportamiento

#### Test 7: Manejo de rate limiting
1. Login con `bloqueado` / cualquiera
2. Verificar toast con mensaje "Acceso bloqueado temporalmente"
3. Verificar que muestra "espera 5 minutos"

#### Test 8: Recovery password completo
1. Click en "¿Olvidaste tu contraseña?"
2. Ingresar email válido
3. Verificar mensaje de éxito + revisar consola
4. Ingresar código `123456` → Avanza
5. Ingresar contraseña válida → Login automático

---

## 🐛 Debugging

### Ver datos del usuario actual

```typescript
// Abrir consola del navegador (F12)
import { useAuthStore } from "@store/authStore";
const user = useAuthStore.getState().user;
console.log("User:", user);
console.log("Permissions:", user?.permissions);
console.log("Is Admin:", user?.is_admin);
console.log("Landing Route:", user?.landing_route);
```

### Verificar permisos manualmente

```typescript
import { usePermissions } from "@features/auth/hooks/usePermissions";

const { hasPermission, hasAnyPermission, isAdmin } = usePermissions();

console.log("Can create expedientes:", hasPermission("expedientes:create"));
console.log("Can read OR update:", hasAnyPermission(["expedientes:read", "expedientes:update"]));
console.log("Is admin:", isAdmin());
```

---

## 📝 Notas Importantes

1. **Los mocks NO persisten entre reloads** (por diseño, para testing limpio)
2. **El delay de red es de 1.5s** (configurable en `NETWORK_DELAY`)
3. **Los tokens NO se guardan** (sistema HttpOnly cookies, solo en modo real)
4. **Permisos son case-sensitive** (`expedientes:create` ≠ `Expedientes:Create`)
5. **El wildcard `"*"` solo lo tiene admin** (bypass total de permisos)

---

## 🔄 Cambiar a Modo Real (Backend)

Cuando el backend esté listo:

1. Cambiar `USE_MOCKS = false` en `frontend/src/api/client.ts`
2. Verificar que `env.apiUrl` apunta al backend correcto
3. Asegurar que el backend devuelve los mismos campos RBAC 2.0:
   - `permissions: string[]`
   - `landing_route: string`
   - `is_admin: boolean`

---

**¿Algún escenario no cubierto?** Agregá un usuario mock nuevo siguiendo el patrón existente en `auth.mocks.ts`.
