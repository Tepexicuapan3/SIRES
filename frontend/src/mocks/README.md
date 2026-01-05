# Mocks - Usuarios de Prueba RBAC 2.0

> **Documentación completa:** [docs/guides/testing.md](../../../docs/guides/testing.md#usuarios-de-prueba-rbac-20)

Este directorio contiene usuarios mock para testing del sistema de autenticación y autorización (RBAC 2.0) de SIRES.

---

## Quick Start

### Activar Mocks

```bash
# frontend/.env.local
VITE_USE_MOCKS=true
```

### Credenciales Principales

| Usuario | Password | Rol | Permisos |
|---------|----------|-----|----------|
| `admin` | `Admin123!` | ADMINISTRADOR | `["*"]` (todos) |
| `dr.garcia` | `Doc123!` | MEDICOS | Consultas + Expedientes + Recetas |
| `recep01` | `Recep123!` | RECEPCION | Citas + Expedientes (crear) |
| `farm01` | `Farm123!` | FARMACIA | Dispensar medicamentos |

**Ver tabla completa:** [docs/guides/testing.md#tabla-de-credenciales](../../../docs/guides/testing.md#tabla-de-credenciales)

---

## Estructura del Directorio

```
mocks/
├── users.mock.ts          # Base de datos de usuarios mock
├── auth.mocks.ts          # Implementación mock de auth API
└── README.md              # Este archivo
```

---

## Uso en Tests

### Importar usuarios mock

```typescript
import { MOCK_USERS_DB, mockLoginResponse, validateMockCredentials } from "@/mocks/users.mock";

// Validar credenciales
const isValid = validateMockCredentials("admin", "Admin123!");

// Obtener respuesta de login
const response = mockLoginResponse("admin");
console.log(response?.user.permissions); // ["*"]
```

### Testing de permisos

```typescript
import { getMockUser } from "@/mocks/users.mock";

const medico = getMockUser("dr.garcia");
expect(medico.permissions).toContain("consultas:create");
expect(medico.permissions).not.toContain("*");
```

---

## Escenarios de Testing

### Escenario: Médico ve solo secciones clínicas

```typescript
// Login: dr.garcia / Doc123!
// Esperado:
// - Sidebar muestra: Consultas, Expedientes, Laboratorio
// - NO muestra: Administración, Hospital, Farmacia
// - Al navegar a /admin → redirect 403
```

### Escenario: Admin ve todo

```typescript
// Login: admin / Admin123!
// Esperado:
// - permissions: ["*"]
// - is_admin: true
// - Sidebar muestra todas las secciones
// - Puede acceder a cualquier ruta
```

**Ver más ejemplos:** [docs/guides/testing.md#escenarios-de-testing-rbac](../../../docs/guides/testing.md#escenarios-de-testing-rbac)

---

## Usuarios de Error

Para testing de manejo de errores:

| Usuario | Error | Status |
|---------|-------|--------|
| `inactivo` | `USER_INACTIVE` | 403 |
| `noexiste` | `USER_NOT_FOUND` | 404 |
| `error` | `INVALID_CREDENTIALS` | 401 |

---

## Patrón Strategy

El sistema usa el patrón **Strategy** para alternar entre API real y mocks:

```typescript
// frontend/src/api/resources/auth.api.ts
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
export const authAPI = USE_MOCKS ? authMocks : realAuthAPI;
```

---

## Mantenimiento

### Agregar nuevo usuario mock

1. Agregar credencial en `MOCK_CREDENTIALS` (en `users.mock.ts`)
2. Crear entrada en `MOCK_USERS_DB` con estructura `Usuario`
3. Asignar `permissions` según rol (consultar `backend/migrations/004_rbac_2_0.sql`)
4. Actualizar docs en [docs/guides/testing.md](../../../docs/guides/testing.md)

### Sincronizar con backend

Cuando se actualicen permisos en `backend/migrations/`:
1. Revisar cambios en `004_rbac_assign_permissions.sql`
2. Actualizar array `permissions` del usuario mock correspondiente
3. Ejecutar tests de RBAC para verificar

---

## Referencias

- **Documentación completa:** [docs/guides/testing.md](../../../docs/guides/testing.md)
- **Tipos TypeScript:** `frontend/src/api/types/auth.types.ts`
- **Migraciones backend:** `backend/migrations/004_rbac_2_0.sql`
- **Guía RBAC Frontend:** [docs/guides/rbac-frontend.md](../../../docs/guides/rbac-frontend.md)

---

**Última actualización:** Enero 2026
