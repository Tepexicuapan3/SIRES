# Testing - SIRES

Estrategias de testing y usuarios de prueba.

---

## Estado Actual

⚠️ **No hay suite de tests automatizados configurada** (ni backend ni frontend).

Esto es **deuda técnica alta**. Por ahora usamos:
- Mocks en frontend (desarrollo sin backend)
- Testing manual con usuarios de prueba
- Smoke tests en endpoints críticos

---

## Sistema de Mocks

> **Documentación completa:** Ver [`frontend/src/mocks/README.md`](../../frontend/src/mocks/README.md)

### Activar Mocks (Frontend)

**Variable de entorno:**

```bash
# frontend/.env.local
VITE_USE_MOCKS=true
```

**Patrón Strategy en código:**

```typescript
// frontend/src/api/resources/auth.api.ts
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
export const authAPI = USE_MOCKS ? authMocks : realAuthAPI;
```

---

## Usuarios de Prueba RBAC 2.0

### Tabla de Credenciales

| Usuario | Password | Rol | Landing Route | Permisos Clave |
|---------|----------|-----|---------------|----------------|
| `admin` | `Admin123!` | ADMINISTRADOR | `/admin` | `["*"]` (wildcard) |
| `dr.garcia` | `Doc123!` | MEDICOS | `/consultas` | Consultas, expedientes, recetas, laboratorio |
| `dra.lopez` | `Esp123!` | ESPECIALISTAS | `/consultas` | Igual que MEDICOS + supervisión |
| `recep01` | `Recep123!` | RECEPCION | `/recepcion` | Citas, expedientes (lectura) |
| `farm01` | `Farm123!` | FARMACIA | `/farmacia` | Recetas, dispensar medicamentos |
| `urg01` | `Urg123!` | URGENCIAS | `/urgencias` | Urgencias, triage, consultas |
| `coord.hosp` | `Hosp123!` | HOSP-COORDINACION | `/hospital` | Coordinación hospitalaria |
| `gerente01` | `Ger123!` | GERENCIA | `/reportes` | Reportes, auditoría |
| `jefe.clinica` | `Jefe123!` | JEFATURA CLINICA | `/consultas` | Supervisión médica |
| `trans01` | `Trans123!` | TRANS-RECETA | `/farmacia` | Transcripción de recetas |

---

### Permisos Detallados por Rol

#### 1. ADMINISTRADOR (`admin`)

#### 1. ADMINISTRADOR (`admin`)

```
Usuario: admin
Password: Admin123!
```

**Permisos:**
- `permissions: ["*"]` (wildcard - acceso total)
- `landing_route: "/admin"`
- `is_admin: true`

**Puede:**
- ✅ TODO (crear, leer, actualizar, eliminar)
- ✅ Gestión de usuarios
- ✅ Configuración del sistema
- ✅ Acceso a todas las secciones

---

#### 2. MEDICOS (`dr.garcia`)

#### 2. MEDICOS (`dr.garcia`)

```
Usuario: dr.garcia
Password: Doc123!
```

**Permisos:**
- Expedientes: `read`, `update`, `search`, `print`
- Consultas: `create`, `read`, `update`, `sign`, `export`
- Recetas: `create`, `read`, `print`
- Citas: `read`
- Laboratorio: `create`, `read`, `print`
- `landing_route: "/consultas"`

**Puede:**
- ✅ Crear/modificar consultas
- ✅ Ver/actualizar expedientes (NO eliminar)
- ✅ Prescribir medicamentos
- ✅ Solicitar estudios de laboratorio
- ❌ NO gestionar usuarios
- ❌ NO acceder a reportes gerenciales

**Sidebar visible:** Consultas, Expedientes, Laboratorio

---

#### 3. RECEPCION (`recep01`)

#### 3. RECEPCION (`recep01`)

```
Usuario: recep01
Password: Recep123!
```

**Permisos:**
- Expedientes: `create`, `read`, `search`
- Citas: `create`, `read`, `update`, `delete`, `confirm`, `reschedule`, `export`
- `landing_route: "/recepcion"`

**Puede:**
- ✅ Crear expedientes nuevos
- ✅ Gestionar citas (crear, modificar, confirmar, reagendar)
- ✅ Buscar expedientes
- ❌ NO modificar expedientes
- ❌ NO acceder a consultas médicas

**Sidebar visible:** Recepción, Expedientes (lectura)

---

#### 4. FARMACIA (`farm01`)

```
Usuario: farm01
Password: Farm123!
```

**Permisos:**
- Recetas: `read`, `print`
- Medicamentos: `dispense`, `read`, `update_stock`
- Expedientes: `read`, `search`
- `landing_route: "/farmacia"`

**Puede:**
- ✅ Dispensar medicamentos
- ✅ Actualizar stock de medicamentos
- ✅ Imprimir recetas
- ✅ Ver expedientes (solo lectura)
- ❌ NO prescribir medicamentos

**Sidebar visible:** Farmacia, Expedientes (lectura)

---

### Usuarios de Prueba para Errores

Estos usuarios simulan casos de error para testing:

| Usuario | Error | Status | Descripción |
|---------|-------|--------|-------------|
| `inactivo` | `USER_INACTIVE` | 403 | Usuario deshabilitado |
| `noexiste` | `USER_NOT_FOUND` | 404 | Usuario inexistente |
| `error` | `INVALID_CREDENTIALS` | 401 | Credenciales inválidas |
| cualquiera + `mal` | `INVALID_CREDENTIALS` | 401 | Password incorrecta |

**Uso en tests:**

```typescript
// Test de error 403
const response = await authAPI.login({ usuario: "inactivo", clave: "cualquiera" });
expect(response).rejects.toThrow("USER_INACTIVE");

// Test de error 404
const response = await authAPI.login({ usuario: "noexiste", clave: "cualquiera" });
expect(response).rejects.toThrow("USER_NOT_FOUND");
```

---

### Escenarios de Testing RBAC

#### Escenario 1: Admin ve todo el sidebar

```typescript
// Login: admin / Admin123!
// Esperado: Sidebar muestra todas las secciones
// Puede: Acceder a cualquier ruta
```

#### Escenario 2: Médico ve solo secciones clínicas

```typescript
// Login: dr.garcia / Doc123!
// Esperado: Sidebar muestra Consultas, Expedientes, Laboratorio
// NO muestra: Administración, Hospital, Farmacia, Reportes
// Al intentar navegar a /admin → redirect o 403
```

#### Escenario 3: Recepcionista sin acceso a consultas

```typescript
// Login: recep01 / Recep123!
// Esperado: Sidebar muestra Recepción, Expedientes
// Al intentar navegar a /consultas → redirect o 403
// Puede: Crear expedientes, NO puede modificarlos
```

#### Escenario 4: Gerente solo reportes

```typescript
// Login: gerente01 / Ger123!
// Esperado: Sidebar muestra Reportes + sección de auditoría
// NO puede: Crear/editar expedientes (solo lectura)
```

---

### Importar Mocks en Tests

```typescript
// frontend/src/__tests__/mocks/auth.test.ts
import { MOCK_USERS_DB, mockLoginResponse, validateMockCredentials } from "@/mocks/users.mock";

describe("Mock Users", () => {
  it("valida credenciales correctas", () => {
    const isValid = validateMockCredentials("admin", "Admin123!");
    expect(isValid).toBe(true);
  });
  
  it("rechaza credenciales incorrectas", () => {
    const isValid = validateMockCredentials("admin", "wrongpass");
    expect(isValid).toBe(false);
  });
  
  it("retorna permisos del médico", () => {
    const response = mockLoginResponse("dr.garcia");
    expect(response?.user.permissions).toContain("consultas:create");
    expect(response?.user.permissions).not.toContain("*");
  });
  
  it("admin tiene wildcard", () => {
    const response = mockLoginResponse("admin");
    expect(response?.user.permissions).toContain("*");
    expect(response?.user.is_admin).toBe(true);
  });
});
```

**Ver más:** [`frontend/src/mocks/README.md`](../../frontend/src/mocks/README.md)

---

## Testing Manual (Backend Real)

### Caso: Crear Usuario

**Endpoint:** `POST /api/v1/users`

**Pre-requisitos:**
1. Backend corriendo: `docker-compose up -d backend`
2. MySQL con datos: Tablas `sy_usuarios`, `cat_roles`
3. Usuario admin logueado (necesita token)

**Paso 1: Login como admin**

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"testrbac","clave":"Test123!"}' \
  -c cookies.txt
```

**Esperado:**
- Status: `200 OK`
- Response con `user` + cookies seteadas

**Paso 2: Crear usuario**

```bash
curl -X POST http://localhost:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: <leer de cookies.txt>" \
  -b cookies.txt \
  -d '{
    "usuario": "testusr001",
    "expediente": "12345678",
    "nombre": "Juan",
    "paterno": "Pérez",
    "materno": "García",
    "curp": "PEGJ900101HDFRZN01",
    "correo": "juan.perez@metro.cdmx.gob.mx",
    "telefono": "5512345678",
    "id_rol": 2
  }'
```

**Esperado:**
- Status: `201 Created`
- Response:
  ```json
  {
    "message": "Usuario creado correctamente...",
    "user": {
      "id_usuario": 123,
      "usuario": "testusr001",
      "temp_password": "Abc123!@#XyZ",
      "must_change_password": true
    }
  }
  ```

**Verificar en BD:**

```sql
SELECT * FROM sy_usuarios WHERE usuario = 'testusr001';
SELECT * FROM users_roles WHERE id_usuario = 123;
SELECT * FROM det_usuarios WHERE id_usuario = 123;
```

---

### Caso: Listar Expedientes

**Endpoint:** `GET /api/v1/expedientes?page=1&page_size=20`

**Paso 1: Login como médico**

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"testmedico","clave":"Test123!"}' \
  -c cookies-medico.txt
```

**Paso 2: Listar**

```bash
curl -X GET "http://localhost:5000/api/v1/expedientes?page=1&page_size=20" \
  -H "X-CSRF-TOKEN: <csrf>" \
  -b cookies-medico.txt
```

**Esperado:**
- Status: `200 OK`
- Response:
  ```json
  {
    "items": [
      {
        "id_expediente": 1,
        "folio": "EXP-001",
        "fecha_alta": "2026-01-05T10:00:00",
        "estado": "ACTIVO"
      }
    ],
    "page": 1,
    "page_size": 20
  }
  ```

---

### Caso: Verificar RBAC (Acceso Denegado)

**Objetivo:** Usuario sin permiso intenta crear expediente.

**Paso 1: Login como enfermero (solo tiene `expedientes:read`)**

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"testenfermero","clave":"Test123!"}' \
  -c cookies-enfermero.txt
```

**Paso 2: Intentar crear expediente**

```bash
curl -X POST http://localhost:5000/api/v1/expedientes \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: <csrf>" \
  -b cookies-enfermero.txt \
  -d '{"folio":"EXP-999"}'
```

**Esperado:**
- Status: `403 Forbidden`
- Response:
  ```json
  {
    "code": "PERMISSION_DENIED",
    "message": "No tienes permisos para esta acción"
  }
  ```

---

## Testing Frontend (Browser)

### Setup

1. Levantar servicios:
   ```bash
   docker-compose up -d
   ```

2. Abrir navegador:
   ```
   http://localhost:5173/login
   ```

3. Abrir DevTools (F12) → Network tab

---

### Test 1: Login y Redirect

**Pasos:**
1. Login con `medico` / `cualquiera`
2. Verificar redirect a `/consultas`
3. Verificar que se muestra página de consultas

**Checklist:**
- [ ] Request `POST /auth/login` → `200 OK`
- [ ] Cookies seteadas (`access_token_cookie`, `csrf_access_token`)
- [ ] Redirect automático a `/consultas`
- [ ] Toast de éxito: "Sesión iniciada"
- [ ] Sidebar muestra nombre de usuario

---

### Test 2: Protección de Rutas

**Pasos:**
1. Login como `enfermero`
2. Intentar acceder a `/admin` (URL directa)

**Checklist:**
- [ ] Redirect automático a `/acceso-denegado` o `/dashboard`
- [ ] Toast de error: "No tienes permisos"
- [ ] NO se renderiza contenido de `/admin`

---

### Test 3: Permission Gate (Botones)

**Pasos:**
1. Login como `usuario` (solo lectura)
2. Ir a `/expedientes`

**Checklist:**
- [ ] Lista de expedientes se muestra
- [ ] Botón "Nuevo Expediente" NO visible
- [ ] Botones de editar/eliminar NO visibles
- [ ] Solo puede ver detalles (lectura)

---

### Test 4: Onboarding Flow

**Pasos:**
1. Login como `nuevo`
2. Redirect a `/onboarding`
3. Completar wizard (términos + password)

**Checklist:**
- [ ] Paso 1: Checkbox términos habilitado
- [ ] Botón "Continuar" disabled hasta aceptar
- [ ] Paso 2: Validación de password (min 8 chars, mayúscula, número)
- [ ] Password y confirmación deben coincidir
- [ ] POST `/auth/complete-onboarding` → `200 OK`
- [ ] Redirect a landing route del rol asignado
- [ ] Toast: "Onboarding completado"

---

### Test 5: Refresh Automático (401)

**Pasos:**
1. Login como cualquier usuario
2. Esperar 16 minutos (access token expira en 15min)
3. Hacer cualquier acción (crear, listar)

**Checklist:**
- [ ] Request falla con `401`
- [ ] Interceptor llama a `POST /auth/refresh`
- [ ] Refresh exitoso → nueva access cookie
- [ ] Request original se reintenta automáticamente
- [ ] Usuario NO ve error
- [ ] NO se hace logout

**Si refresh falla (refresh token expirado):**
- [ ] Logout automático
- [ ] Redirect a `/login`
- [ ] Toast: "Sesión expirada"

---

## Estrategia de Testing (Roadmap)

### Backend (Pendiente)

**Framework:** pytest

**Estructura:**
```
backend/tests/
├── unit/
│   ├── test_use_cases/
│   ├── test_repositories/
│   └── test_services/
├── integration/
│   ├── test_auth_routes.py
│   ├── test_permissions_routes.py
│   └── test_users_routes.py
└── fixtures/
    └── mock_data.py
```

**Cobertura mínima:**
- [ ] Use cases (80%+): Login, Onboarding, RBAC
- [ ] Routes (smoke): Auth, Permissions, Users
- [ ] Decoradores RBAC: `@admin_required`, `@requires_permission`

---

### Frontend (Pendiente)

**Framework:** Vitest + React Testing Library

**Estructura:**
```
frontend/src/
├── features/auth/
│   ├── components/
│   │   └── LoginForm.test.tsx
│   └── hooks/
│       ├── useLogin.test.ts
│       └── usePermissions.test.ts
└── components/shared/
    └── PermissionGate.test.tsx
```

**Cobertura mínima:**
- [ ] Hooks (TanStack Query): Login, Permissions
- [ ] Componentes críticos: LoginForm, OnboardingWizard
- [ ] Guards: ProtectedRoute, PermissionGate

---

## Troubleshooting

### Mock no responde

**Causa:** `USE_MOCKS` en `false`.

**Solución:**
```ts
// frontend/src/api/client.ts
const USE_MOCKS = true;
```

### Error 308 PERMANENT REDIRECT

**Causa:** Flask hace redirect por trailing slash.

**Solución:**
```python
# backend/src/__init__.py
app.url_map.strict_slashes = False
```

### CSRF token missing

**Causa:** Interceptor no lee cookie.

**Solución:**
Verificar en DevTools → Application → Cookies que existe `csrf_access_token`.

Si no existe:
1. Hacer login nuevamente
2. Verificar backend setea cookie en response

---

## Próximos Pasos

1. **Configurar pytest:** Ver ejemplo en `backend/tests/` (crear estructura)
2. **Configurar Vitest:** Ver `frontend/vitest.config.ts`
3. **Escribir tests críticos:** Auth, RBAC, Forms
4. **CI/CD:** GitHub Actions con tests automáticos

---

**Última actualización:** Enero 2026
