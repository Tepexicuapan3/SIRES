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

## Usuarios de Prueba (Mocks)

### Activar Mocks (Frontend)

**Archivo:** `frontend/src/api/client.ts`

```ts
// MODO MOCK (desarrollo sin backend)
const USE_MOCKS = true;

// MODO REAL (conecta al backend)
const USE_MOCKS = false;
```

### 1. Admin (Acceso Total)

```
Usuario: admin
Password: cualquiera
```

**Permisos:**
- `permissions: ["*"]` (wildcard)
- `landing_route: "/admin"`
- `is_admin: true`
- Roles: `["ADMIN", "ROL_MEDICO"]`

**Puede:**
- ✅ TODO (crear, leer, actualizar, eliminar)
- ✅ Gestión de usuarios
- ✅ Configuración del sistema

---

### 2. Médico (Permisos Clínicos Completos)

```
Usuario: medico
Password: cualquiera
```

**Permisos:**
- `expedientes:create`, `expedientes:read`, `expedientes:update`, `expedientes:delete`
- `consultas:create`, `consultas:read`, `consultas:update`
- `pacientes:read`, `pacientes:update`
- `landing_route: "/consultas"`
- `is_admin: false`

**Puede:**
- ✅ Crear/modificar/eliminar expedientes
- ✅ Crear/modificar consultas
- ✅ Ver/actualizar pacientes
- ❌ NO gestionar usuarios
- ❌ NO acceder a `/admin`

---

### 3. Enfermero (Permisos Limitados)

```
Usuario: enfermero
Password: cualquiera
```

**Permisos:**
- `expedientes:read`
- `consultas:create`, `consultas:read`, `consultas:update`
- `pacientes:read`
- `landing_route: "/dashboard"`

**Puede:**
- ✅ VER expedientes (solo lectura)
- ✅ Crear/modificar consultas
- ✅ Ver pacientes
- ❌ NO crear/eliminar expedientes
- ❌ NO modificar pacientes

---

### 4. Usuario Genérico (Solo Lectura)

```
Usuario: usuario
Password: cualquiera
```

**Permisos:**
- `expedientes:read`, `consultas:read`, `pacientes:read`
- `landing_route: "/dashboard"`

**Puede:**
- ✅ VER todo
- ❌ NO crear/modificar/eliminar NADA

---

### 5. Usuario Nuevo (Onboarding)

```
Usuario: nuevo
Password: cualquiera
```

**Características:**
- `permissions: []`
- `must_change_password: true`
- `landing_route: "/onboarding"`

**Flujo esperado:**
1. Login exitoso
2. Redirect automático a `/onboarding`
3. DEBE aceptar términos y cambiar password
4. Después se asignan permisos

---

## Testing de Errores

### Errores de Auth

| Usuario | Contraseña | Error | Status | Descripción |
|---------|------------|-------|--------|-------------|
| `inactivo` | cualquiera | `USER_INACTIVE` | 403 | Usuario deshabilitado |
| `noexiste` | cualquiera | `USER_NOT_FOUND` | 404 | Usuario inexistente |
| `error` | cualquiera | `INVALID_CREDENTIALS` | 401 | Credenciales inválidas |
| cualquiera | `mal` | `INVALID_CREDENTIALS` | 401 | Password incorrecta |

**Esperado en UI:**
- Toast de error con mensaje descriptivo
- NO redirect
- Form limpio (o conservar usuario)

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
