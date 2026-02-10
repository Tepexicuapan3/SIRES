# Guía de Testing Frontend (SIRES)

Este proyecto utiliza una arquitectura de testing moderna basada en **Vitest** y **MSW (Mock Service Worker)**.

El objetivo es permitir el desarrollo y testing sin depender de que el backend esté levantado, simulando respuestas de red realistas.

---

## 🎮 Modo Desarrollo Offline (Mocking en Navegador)

Podés desarrollar toda la aplicación sin conexión al backend. MSW interceptará las peticiones en el navegador.

### Activar Mocks
1. Asegurate de tener `.env.local` con:
   ```bash
   VITE_USE_MOCKS=true
   ```
2. Ejecutá `bun dev`.
3. Verás `[MSW] Mocking enabled` en la consola del navegador.

### 🔑 Credenciales Mágicas (Magic Credentials)

Usá estos usuarios para probar diferentes escenarios y errores en el Login:

| Usuario | Contraseña | Escenario | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **(cualquiera)** | (cualquiera) | **Login Exitoso** | Acceso al Dashboard (`/dashboard` por defecto) |
| `error` | (cualquiera) | **Credenciales Inválidas** | Error 401 "Usuario o contraseña incorrectos" |
| `locked` | (cualquiera) | **Usuario Bloqueado** | Error 423 "Cuenta bloqueada temporalmente" |
| `inactive` | (cualquiera) | **Usuario Inactivo** | Error 403 "Cuenta desactivada" |
| `expired` | (cualquiera) | **Cuenta Expirada** | Error 401 "Tu cuenta ha expirado" |
| `maintenance` | (cualquiera) | **Mantenimiento** | Error 503 "Sistema en mantenimiento" |
| `broken` | (cualquiera) | **Error Servidor** | Error 500 "Error interno" |
| `newuser` | (cualquiera) | **Primer Login** | Redirección a `/onboarding` (cambio de clave) |

### 🎭 Usuarios por Rol (Testing de Navegación)

Usá estos usuarios para probar que el Sidebar y la redirección funcionan según el perfil:

| Usuario | Rol | Landing Route | Permisos Clave |
| :--- | :--- | :--- | :--- |
| `admin` | Admin | `/admin/panel` | Acceso Total (`*`) |
| `clinico` | Clinico | `/clinico/consultas` | Consultas, Expedientes, Somatometría |
| `recepcion` | Recepcion | `/recepcion/fichas` | Fichas, Incapacidades |
| `farmacia` | Farmacia | `/farmacia/recetas` | Dispensar, Inventario |
| `urgencias` | Urgencias | `/urgencias/triage` | Triage |
| `hospital` | HOSPITAL | `/hospital` | Coordinación, Admisión |

### 🔐 Recuperación de Contraseña

Para probar el flujo de "Olvidé mi contraseña":

1. **Email:** Cualquier email es válido (ej: `test@metro.cdmx.gob.mx`).
   - *Excepción:* `error@fail.com` devuelve error 404 (Usuario no encontrado).
2. **Código OTP:**
   - `123456` → ✅ **Código Válido** (Permite cambiar password)
   - `000000` → ❌ Error "Código expirado"
   - `999999` → ❌ Error "Exceso de intentos"
   - *(otro)* → ❌ Error "Código incorrecto"

### 🚀 Onboarding / Reset Password

El mock valida la seguridad de la contraseña igual que el backend real.

- **Contraseña Válida:** Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 símbolo.
  - Ej: `SecurePass123!`
- **Contraseña Débil:** Cualquier otra combinación.
  - Ej: `weak`, `12345678`, `password` → ❌ Error "Contraseña muy débil"
- **Simular Token Expirado (Onboarding):**
  - Usar contraseña `ExpiredToken1!` → ❌ Error 401 "TOKEN_EXPIRED"
- **Simular Error Backend (Onboarding):**
  - Usar contraseña `InvalidToken1!` → ❌ Error 500 "ONBOARDING_FAILED"
- **Simular Token Expirado (Reset):**
  - Usar contraseña `ExpiredToken1!` → ❌ Error 401 "TOKEN_EXPIRED"
- **Simular Token Inválido (Reset):**
  - Usar contraseña `TokenInvalid1!` → ❌ Error 401 "TOKEN_INVALID"
- **Simular Error Backend (Reset):**
  - Usar contraseña `InvalidToken1!` → ❌ Error 500 "INTERNAL_SERVER_ERROR"

---

## 🏗️ Arquitectura de Tests

Todo el código de testing vive en `frontend/src/test/`.

```
src/test/
├── factories/             # Generadores de datos falsos (FakerJS)
│   └── users.ts           # Crea usuarios, roles y perfiles completos
│
├── integration/           # Tests de integración (UI/API + MSW)
│   ├── auth/              # Flujos de autenticación (login, recovery, onboarding)
│   ├── admin/             # RBAC, roles, permisos
│   ├── catalogos/         # Catálogos (centros de atención)
│   └── users/             # Tablas, listados y UI de usuarios
│
├── unit/                  # Tests unitarios (lógica pura)
│   └── auth/              # Helpers y cache de sesión
│
├── mocks/                 # Configuración de MSW
│   ├── handlers/          # Respuestas simuladas por dominio
│   │   ├── auth.ts        # Login, Logout, Recovery, Onboarding
│   │   └── users.ts       # CRUD Usuarios
│   ├── browser.ts         # Configuración para Navegador
│   ├── server.ts          # Configuración para Vitest (Node)
│   └── handlers.ts        # Índice de todos los handlers
│
├── setup.ts               # Configuración global de Vitest (beforeAll, etc)
└── utils.ts               # Render personalizado (wrappers de Query/Router)
```


## ✅ Cobertura Auth (actual)

- `src/test/integration/auth/AuthLoginFlow.test.ts` (login + sesión)
- `src/test/integration/auth/AuthRecoveryFlow.test.ts` (recovery)
- `src/test/integration/auth/AuthOnboardingFlow.test.ts` (onboarding)
- `src/test/integration/auth/ui/AuthLoginPage.ui.test.tsx` (UI login)
- `src/test/integration/auth/ui/AuthRecoveryFlow.ui.test.tsx` (UI recovery)
- `src/test/integration/auth/ui/AuthOnboardingPage.ui.test.tsx` (UI onboarding)
- `src/test/unit/auth/auth-schemas.test.ts` (schemas y validaciones)
- `src/test/unit/auth/auth-rules.test.ts` (reglas de contraseña y OTP)
- `src/test/unit/auth/auth-messages.test.ts` (mapeo de errores)

---

## 🛠️ Cómo agregar nuevos Tests/Mocks

### 1. Crear una Fábrica (Factory)
Si necesitás un dato nuevo (ej: Expediente), creá `src/test/factories/expedientes.ts`.
Usá `@faker-js/faker` para que los datos sean variados pero tipados correctamente.

```typescript
export const createMockExpediente = (overrides = {}) => ({
  id: faker.number.int(),
  folio: faker.string.alphanumeric(8),
  ...overrides
});
```

### 2. Crear un Handler
Creá `src/test/mocks/handlers/expedientes.ts`. Intercepta la ruta y devuelve datos usando tu fábrica.

```typescript
http.get("*/expedientes", () => {
  const data = Array.from({ length: 5 }).map(createMockExpediente);
  return HttpResponse.json({ items: data });
})
```

**No olvides registrarlo** en `src/test/mocks/handlers.ts`.

### 3. Escribir el Test
Usá el `render` personalizado de `src/test/utils.ts`.

```typescript
import { render, screen } from "../utils";

it("muestra los expedientes", async () => {
  render(<ExpedientesList />);
  await waitFor(() => expect(screen.getByText("EXP-001")).toBeInTheDocument());
});
```

---

## ⚡ Comandos

```bash
# Correr todos los tests
npm test

# Correr tests con interfaz gráfica (recomendado)
npm run test:ui

# Ver cobertura de código
npm run test:coverage
```
