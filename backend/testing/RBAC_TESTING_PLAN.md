# RBAC CRUD - Plan de Testing Completo

## Objetivo
Validar el 100% de funcionalidad del sistema RBAC CRUD implementado en las Fases 0-6.

## Estrategia de Testing

### Capa 1: Base de Datos (Schema Validation)
- ✅ Verificar existencia de tablas
- ✅ Verificar estructura de columnas
- ✅ Verificar constraints (FK, UNIQUE, NOT NULL)
- ✅ Verificar datos seed iniciales

### Capa 2: Backend API (Integration Testing)
- 🔄 CRUD Roles (7 endpoints)
- 🔄 CRUD Permisos (7 endpoints)
- 🔄 Multi-Rol Usuarios (4 endpoints)
- 🔄 Permission Overrides (4 endpoints)

### Capa 3: Frontend UI (Component Testing)
- ⏳ Roles UI (RolesList, RoleForm, RolePermissionsManager)
- ⏳ Permissions UI (PermissionsList, PermissionForm)
- ⏳ Users UI (UsersList, UserRolesManager, UserPermissionOverrides)

### Capa 4: E2E (End-to-End Flows)
- ⏳ Flujo completo: Crear rol → Asignar permisos → Asignar a usuario
- ⏳ Flujo completo: Multi-rol + cambiar primario
- ⏳ Flujo completo: Permission override temporal

---

## Test Suite 1: Base de Datos

### Test 1.1: Verificar Schema de Tablas

**Tabla: cat_roles**
```sql
DESCRIBE cat_roles;
```
Esperado: id_rol, nombre, descripcion, landing_route, priority, is_admin, is_system, created_at, updated_at

**Tabla: cat_permissions**
```sql
DESCRIBE cat_permissions;
```
Esperado: id_permiso, code, description, category, is_system, created_at

**Tabla: role_permissions**
```sql
DESCRIBE role_permissions;
```
Esperado: id_rol, id_permiso, assigned_at

**Tabla: users_roles**
```sql
DESCRIBE users_roles;
```
Esperado: id_usuario, id_rol, is_primary, assigned_at, assigned_by

**Tabla: user_permission_overrides**
```sql
DESCRIBE user_permission_overrides;
```
Esperado: id_usuario, permission_code, effect, expires_at, created_at, created_by

### Test 1.2: Verificar Datos Seed

**Roles del Sistema (id_rol ≤ 22):**
```sql
SELECT id_rol, nombre, is_system FROM cat_roles WHERE is_system = 1;
```
Esperado: Al menos 1 rol ADMIN con is_system = 1

**Permisos del Sistema:**
```sql
SELECT code, category FROM cat_permissions WHERE is_system = 1 LIMIT 10;
```
Esperado: Permisos base como `usuarios:read`, `roles:create`, etc.

### Test 1.3: Verificar Constraints

**Foreign Keys:**
```sql
-- role_permissions debe referenciar cat_roles y cat_permissions
SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'role_permissions' 
  AND TABLE_SCHEMA = 'dbsisem'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

**Unique Constraints:**
```sql
-- cat_roles.nombre debe ser UNIQUE
SHOW INDEX FROM cat_roles WHERE Key_name != 'PRIMARY';

-- cat_permissions.code debe ser UNIQUE
SHOW INDEX FROM cat_permissions WHERE Key_name != 'PRIMARY';
```

---

## Test Suite 2: Backend API Testing

### Prerequisito: Obtener Token de Autenticación

```bash
# Login como usuario con permisos admin
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"USUARIO_ADMIN","clave":"PASSWORD"}' \
  -c /tmp/cookies.txt

# Extraer CSRF token
export CSRF_TOKEN=$(grep csrf_access_token /tmp/cookies.txt | awk '{print $7}')
```

### Test 2.1: CRUD Roles

**Test 2.1.1: GET /api/v1/roles - Listar todos los roles**
```bash
curl -X GET http://localhost:5000/api/v1/roles \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Array de roles
# - Cada rol tiene: id_rol, nombre, priority, permisos_count
```

**Test 2.1.2: POST /api/v1/roles - Crear rol custom**
```bash
curl -X POST http://localhost:5000/api/v1/roles \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "TEST_ROLE_AUTO",
    "descripcion": "Rol creado por test automatizado",
    "landing_route": "/dashboard",
    "priority": 500,
    "is_admin": false
  }'

# Validar:
# - Status 201
# - Retorna { id_rol, nombre, ... }
# - Guardar id_rol para tests posteriores
```

**Test 2.1.3: GET /api/v1/roles/:id - Obtener rol específico**
```bash
curl -X GET http://localhost:5000/api/v1/roles/{ID_CREADO} \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Datos coinciden con el rol creado
```

**Test 2.1.4: PUT /api/v1/roles/:id - Actualizar rol**
```bash
curl -X PUT http://localhost:5000/api/v1/roles/{ID_CREADO} \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Rol actualizado por test",
    "priority": 600
  }'

# Validar:
# - Status 200
# - Descripción y prioridad actualizadas
```

**Test 2.1.5: DELETE /api/v1/roles/:id - Eliminar rol**
```bash
curl -X DELETE http://localhost:5000/api/v1/roles/{ID_CREADO} \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Mensaje de confirmación
# - Rol desaparece de GET /roles
```

**Test 2.1.6: POST /api/v1/permissions/assign - Asignar permisos a rol**
```bash
# Crear rol temporal
ROLE_ID=$(curl -X POST http://localhost:5000/api/v1/roles ...)

# Asignar permisos
curl -X POST http://localhost:5000/api/v1/permissions/assign \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": '${ROLE_ID}',
    "permission_ids": [1, 2, 3]
  }'

# Validar:
# - Status 200
# - Permisos asignados correctamente
```

**Test 2.1.7: DELETE /api/v1/permissions/roles/:rid/permissions/:pid - Revocar permiso**
```bash
curl -X DELETE http://localhost:5000/api/v1/permissions/roles/{ROLE_ID}/permissions/1 \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Permiso eliminado de la relación
```

### Test 2.2: CRUD Permisos

**Test 2.2.1: GET /api/v1/permissions - Listar permisos**
```bash
curl -X GET http://localhost:5000/api/v1/permissions \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Array de permisos
```

**Test 2.2.2: POST /api/v1/permissions - Crear permiso**
```bash
curl -X POST http://localhost:5000/api/v1/permissions \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test:auto",
    "description": "Permiso de test automatizado",
    "category": "TESTING"
  }'

# Validar:
# - Status 201
# - Permiso creado correctamente
```

**Test 2.2.3: PUT /api/v1/permissions/:id - Actualizar permiso**
```bash
curl -X PUT http://localhost:5000/api/v1/permissions/{ID} \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Descripción actualizada",
    "category": "OTROS"
  }'

# Validar:
# - Status 200
# - Descripción/categoría actualizadas
# - code NO debe cambiar (inmutable)
```

**Test 2.2.4: DELETE /api/v1/permissions/:id - Eliminar permiso**
```bash
curl -X DELETE http://localhost:5000/api/v1/permissions/{ID} \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Permiso eliminado
```

### Test 2.3: Multi-Rol Usuarios

**Test 2.3.1: GET /api/v1/users/:id/roles - Obtener roles de usuario**
```bash
curl -X GET http://localhost:5000/api/v1/users/1/roles \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Array de roles asignados
# - Uno tiene is_primary = true
```

**Test 2.3.2: POST /api/v1/users/:id/roles - Asignar roles**
```bash
curl -X POST http://localhost:5000/api/v1/users/1/roles \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": [2, 3],
    "primary_role_id": 2
  }'

# Validar:
# - Status 200
# - Roles asignados
# - primary_role_id = 2 tiene is_primary = true
```

**Test 2.3.3: PUT /api/v1/users/:id/roles/primary - Cambiar rol primario**
```bash
curl -X PUT http://localhost:5000/api/v1/users/1/roles/primary \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 3
  }'

# Validar:
# - Status 200
# - Rol 3 ahora es primario
# - Solo un rol tiene is_primary = true
```

**Test 2.3.4: DELETE /api/v1/users/:id/roles/:roleId - Revocar rol**
```bash
curl -X DELETE http://localhost:5000/api/v1/users/1/roles/3 \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Rol revocado
# - Si era primario, otro rol debe ser primario ahora
# - Error si es el último rol
```

### Test 2.4: Permission Overrides

**Test 2.4.1: POST /api/v1/permissions/users/:id/overrides - Agregar override**
```bash
curl -X POST http://localhost:5000/api/v1/permissions/users/1/overrides \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_code": "test:auto",
    "effect": "ALLOW",
    "expires_at": "2026-12-31"
  }'

# Validar:
# - Status 201
# - Override creado
```

**Test 2.4.2: GET /api/v1/permissions/users/:id/overrides - Listar overrides**
```bash
curl -X GET http://localhost:5000/api/v1/permissions/users/1/overrides \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Array con el override creado
```

**Test 2.4.3: GET /api/v1/permissions/users/:id/effective - Permisos efectivos**
```bash
curl -X GET http://localhost:5000/api/v1/permissions/users/1/effective \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - granted: permisos de roles + ALLOW overrides
# - denied: DENY overrides
```

**Test 2.4.4: DELETE /api/v1/permissions/users/:id/overrides/:code - Eliminar override**
```bash
curl -X DELETE http://localhost:5000/api/v1/permissions/users/1/overrides/test:auto \
  -b /tmp/cookies.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"

# Validar:
# - Status 200
# - Override eliminado
```

---

## Test Suite 3: Reglas de Negocio

### Test 3.1: Validaciones de Roles

- ❌ No permitir crear rol con nombre duplicado
- ❌ No permitir editar rol del sistema (id_rol ≤ 22)
- ❌ No permitir eliminar rol del sistema
- ❌ No permitir prioridad < 1 o > 999
- ❌ No permitir nombre vacío

### Test 3.2: Validaciones de Permisos

- ❌ No permitir crear permiso con código duplicado
- ❌ No permitir código sin formato `recurso:accion`
- ❌ No permitir editar código de permiso existente
- ❌ No permitir eliminar permiso del sistema (is_system = 1)

### Test 3.3: Validaciones Multi-Rol

- ❌ No permitir asignar rol inexistente
- ❌ No permitir revocar último rol de usuario
- ❌ No permitir cambiar a rol primario no asignado
- ✅ Permitir múltiples roles simultáneos
- ✅ Solo un rol puede ser primario

### Test 3.4: Validaciones Overrides

- ❌ No permitir fecha de expiración pasada
- ❌ No permitir effect diferente de ALLOW/DENY
- ❌ No permitir permission_code inexistente
- ✅ Permitir expires_at = NULL (sin expiración)

---

## Test Suite 4: Testing Manual UI (Checklist)

### Roles UI
- [ ] Tabla carga correctamente
- [ ] Crear rol abre formulario
- [ ] Validación Zod funciona (nombre MAYÚSCULAS)
- [ ] Submit crea rol y muestra toast
- [ ] Editar rol carga datos correctos
- [ ] Eliminar rol muestra confirmación
- [ ] Manager de permisos filtra por categoría
- [ ] Asignar permisos (bulk) funciona
- [ ] Revocar permiso individual funciona

### Permissions UI
- [ ] Filtro por categoría funciona
- [ ] Crear permiso valida formato `code`
- [ ] Editar permiso NO permite cambiar código
- [ ] Eliminar permiso custom funciona
- [ ] Badge "Sistema" en permisos protegidos

### Users UI
- [ ] Búsqueda filtra en tiempo real
- [ ] Badges de roles muestran ★ primario
- [ ] Ver detalle muestra info + managers
- [ ] Asignar roles (checkboxes) funciona
- [ ] Cambiar primario actualiza badges
- [ ] Revocar rol valida último rol
- [ ] Agregar override muestra dialog
- [ ] DatePicker valida fechas pasadas
- [ ] Ver permisos efectivos consolida correctamente
- [ ] Eliminar override funciona

---

## Resultados Esperados

### ✅ Pass Criteria
- Todos los endpoints retornan 200/201 para operaciones válidas
- Todos los endpoints retornan 400/403/404 para operaciones inválidas
- Validaciones de negocio aplican correctamente
- Cache de TanStack Query se invalida correctamente
- UI muestra estados: loading, success, error
- Toast notifications aparecen en operaciones
- Metro CDMX design tokens aplicados
- Accesibilidad WCAG 2.1 AA (navegación teclado, ARIA labels)

### ❌ Fail Criteria
- Cualquier endpoint retorna 500 (server error)
- Validaciones no aplican
- UI permite operaciones prohibidas
- Cache no se invalida (datos stale)
- Errores no muestran feedback al usuario

---

## Ejecución

```bash
# 1. Verificar servicios corriendo
docker-compose ps

# 2. Ejecutar tests BD
mysql -u sires -p -h 10.15.15.76 dbsisem < test_schema.sql

# 3. Ejecutar tests Backend
python backend/testing/test_rbac_full_suite.py

# 4. Ejecutar tests UI (manual)
# Abrir navegador: http://localhost:5173
# Seguir checklist de Test Suite 4
```

---

**Estado:** En Progreso  
**Última actualización:** 2026-01-06
