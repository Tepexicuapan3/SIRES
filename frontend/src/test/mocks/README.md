# Mocks - Mock Service Worker (MSW)

Este directorio contiene la configuración y handlers para **Mock Service Worker (MSW)**, la estrategia actual de mocking para tests y desarrollo en SIRES.

MSW intercepta las peticiones HTTP a nivel de red, permitiendo que la aplicación funcione como si estuviera conectada a un backend real, pero respondiendo con datos controlados.

## Estructura

*   `handlers/`: Definición de respuestas mock para cada recurso (auth, users, etc.).
*   `browser.ts`: Configuración del worker para el navegador (desarrollo).
*   `server.ts`: Configuración del server para tests (Node.js/Vitest).
*   `handlers.ts`: Agrupación de todos los handlers.

## Usuarios de Prueba (Login)

El handler de autenticación (`handlers/auth.ts`) está configurado para aceptar **cualquier contraseña** (mientras no sea "wrong") para los siguientes usuarios, simulando diferentes roles y escenarios.

### Roles y Perfiles

| Usuario | Rol | Landing Page | Descripción |
| :--- | :--- | :--- | :--- |
| `admin` | **ADMINISTRADOR** | `/admin` | Acceso total (permiso `*`). |
| `medico` | **MEDICOS** | `/consultas` | Acceso a consultas, recetas, lab. |
| `recepcion` | **RECEPCION** | `/recepcion` | Registro de pacientes y citas. |
| `farmacia` | **FARMACIA** | `/farmacia` | Dispensación e inventario. |
| `urgencias` | **URGENCIAS** | `/urgencias` | Triage y atención de urgencias. |
| `hospital` | **HOSPITAL** | `/hospital` | Coordinación hospitalaria. |
| `newuser` | (Nuevo) | - | Simula usuario que requiere onboarding. |

> **Nota:** La contraseña puede ser cualquiera (ej. `123456`), excepto `wrong`.

### Escenarios de Error

Estos usuarios simulan respuestas de error específicas del backend al intentar iniciar sesión:

| Usuario | Error Simulado | Código | HTTP Status |
| :--- | :--- | :--- | :--- |
| `error` | Credenciales inválidas | `INVALID_CREDENTIALS` | 401 |
| `wrong` | (Si se usa como pass) | `INVALID_CREDENTIALS` | 401 |
| `locked` | Cuenta bloqueada | `USER_LOCKED` | 423 |
| `inactive` | Usuario inactivo | `USER_INACTIVE` | 403 |
| `expired` | Cuenta expirada | `ACCOUNT_EXPIRED` | 401 |
| `maintenance`| Mantenimiento | `SERVICE_UNAVAILABLE` | 503 |
| `broken` | Error interno | `SERVER_ERROR` | 500 |

## Uso en Desarrollo

Los mocks se activan automáticamente si `VITE_USE_MOCKS=true` en tu archivo `.env`.

```bash
# .env
VITE_USE_MOCKS=true
```

## Uso en Tests

En los tests de integración (Vitest), el `server` de mocks se inicia automáticamente (ver `frontend/src/test/setup.ts`).
