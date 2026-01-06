# Testing Manual: CRUD de Roles (Fase 1)

> **Objetivo:** Verificar que los 5 endpoints del CRUD de roles funcionan correctamente.

## Pre-requisitos

1. **Backend ejecutándose:**
   ```bash
   cd backend
   python run.py
   ```
   Debe mostrar: `Running on http://localhost:5000`

2. **Obtener tokens de autenticación:**
   
   Necesitás un usuario con el permiso `roles:read`, `roles:create`, `roles:update`, `roles:delete`.
   
   **Usuarios disponibles con permisos:**
   - ADMINISTRADOR (id_rol=22)
   - MEDICOS (id_rol=1)

   **Hacer login:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "num_empleado": "TU_NUMERO_EMPLEADO",
       "password": "TU_PASSWORD"
     }' \
     -c cookies.txt \
     -v
   ```

   Esto guardará las cookies (con `access_token`) en `cookies.txt`.
   
   **Extraer CSRF token:**
   En la respuesta, buscá el header `X-CSRF-TOKEN` y guardalo.

---

## Test 1: Listar Roles (GET /api/v1/roles)

**Objetivo:** Verificar que se pueden listar todos los roles con sus metadatos.

**Request:**
```bash
curl -X GET http://localhost:5000/api/v1/roles \
  -b cookies.txt \
  -H "Content-Type: application/json"
```

**Resultado esperado:**
- Status: `200 OK`
- Body: Array de roles con estructura:
  ```json
  {
    "roles": [
      {
        "id_rol": 1,
        "rol": "MEDICOS",
        "desc_rol": "Rol de médicos",
        "landing_route": "/medical-dashboard",
        "priority": 10,
        "is_admin": 0,
        "est_rol": "A",
        "permission_count": 59,
        "user_count": 5
      },
      ...
    ]
  }
  ```

**Checklist:**
- [ ] Status 200
- [ ] Retorna array con roles
- [ ] Cada rol tiene `permission_count` y `user_count`
- [ ] Roles del sistema (id≤22) están presentes

---

## Test 2: Obtener Detalle de Rol (GET /api/v1/roles/:id)

**Objetivo:** Verificar que se puede obtener el detalle de un rol específico.

**Request:**
```bash
curl -X GET http://localhost:5000/api/v1/roles/22 \
  -b cookies.txt \
  -H "Content-Type: application/json"
```

**Resultado esperado:**
- Status: `200 OK`
- Body:
  ```json
  {
    "role": {
      "id_rol": 22,
      "rol": "ADMINISTRADOR",
      "desc_rol": "Administrador del sistema",
      "landing_route": "/admin",
      "priority": 1,
      "is_admin": 1,
      "est_rol": "A",
      "permission_count": 68,
      "user_count": 2
    }
  }
  ```

**Checklist:**
- [ ] Status 200
- [ ] Retorna objeto `role` con todos los campos
- [ ] `permission_count` > 0
- [ ] Si el rol no existe (ej: id=9999), retorna 404

---

## Test 3: Crear Rol (POST /api/v1/roles)

**Objetivo:** Verificar que se puede crear un rol nuevo.

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/roles \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: TU_CSRF_TOKEN_AQUI" \
  -d '{
    "rol": "PRUEBA_ENFERMERIA",
    "desc_rol": "Rol de prueba para personal de enfermería",
    "landing_route": "/nursing-dashboard",
    "priority": 100
  }'
```

**Resultado esperado:**
- Status: `201 Created`
- Body:
  ```json
  {
    "message": "Rol creado exitosamente",
    "role": {
      "id_rol": 23,
      "rol": "PRUEBA_ENFERMERIA",
      "desc_rol": "Rol de prueba para personal de enfermería",
      "landing_route": "/nursing-dashboard",
      "priority": 100,
      "is_admin": 0,
      "est_rol": "A"
    }
  }
  ```

**Checklist:**
- [ ] Status 201
- [ ] Retorna `id_rol` generado
- [ ] `est_rol` = 'A' (activo)
- [ ] `is_admin` = 0 (por defecto)

**Validaciones a probar:**

1. **Nombre duplicado (debe fallar):**
   ```bash
   curl -X POST http://localhost:5000/api/v1/roles \
     -b cookies.txt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
     -d '{
       "rol": "PRUEBA_ENFERMERIA",
       "desc_rol": "Duplicado",
       "landing_route": "/test",
       "priority": 100
     }'
   ```
   - Debe retornar: `400 Bad Request` con error `ROLE_NAME_EXISTS`

2. **Nombre muy largo (debe fallar):**
   ```bash
   curl -X POST http://localhost:5000/api/v1/roles \
     -b cookies.txt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
     -d '{
       "rol": "ESTE_ES_UN_NOMBRE_MUY_LARGO_QUE_SUPERA_LOS_50_CARACTERES_PERMITIDOS",
       "desc_rol": "Test",
       "landing_route": "/test",
       "priority": 100
     }'
   ```
   - Debe retornar: `400 Bad Request` con error `INVALID_ROLE_NAME`

3. **Descripción vacía (debe fallar):**
   ```bash
   curl -X POST http://localhost:5000/api/v1/roles \
     -b cookies.txt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
     -d '{
       "rol": "TEST_ROL",
       "desc_rol": "",
       "landing_route": "/test",
       "priority": 100
     }'
   ```
   - Debe retornar: `400 Bad Request`

4. **Landing route inválido (debe fallar):**
   ```bash
   curl -X POST http://localhost:5000/api/v1/roles \
     -b cookies.txt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
     -d '{
       "rol": "TEST_ROL",
       "desc_rol": "Test",
       "landing_route": "sin-slash-inicial",
       "priority": 100
     }'
   ```
   - Debe retornar: `400 Bad Request` con error `INVALID_LANDING_ROUTE`

---

## Test 4: Actualizar Rol (PUT /api/v1/roles/:id)

**Objetivo:** Verificar que se puede actualizar un rol existente (no del sistema).

**Request (actualizar rol creado en Test 3):**
```bash
curl -X PUT http://localhost:5000/api/v1/roles/23 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
  -d '{
    "desc_rol": "Descripción actualizada - Personal de enfermería con turnos rotativos",
    "priority": 90
  }'
```

**Resultado esperado:**
- Status: `200 OK`
- Body:
  ```json
  {
    "message": "Rol actualizado exitosamente",
    "role": {
      "id_rol": 23,
      "rol": "PRUEBA_ENFERMERIA",
      "desc_rol": "Descripción actualizada - Personal de enfermería con turnos rotativos",
      "landing_route": "/nursing-dashboard",
      "priority": 90,
      "is_admin": 0,
      "est_rol": "A"
    }
  }
  ```

**Checklist:**
- [ ] Status 200
- [ ] Campos actualizados reflejados en la respuesta
- [ ] Campos no enviados (ej: `rol`) NO cambian

**Validaciones a probar:**

1. **Intentar actualizar rol del sistema (debe fallar):**
   ```bash
   curl -X PUT http://localhost:5000/api/v1/roles/1 \
     -b cookies.txt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
     -d '{
       "desc_rol": "Intentando cambiar rol del sistema"
     }'
   ```
   - Debe retornar: `403 Forbidden` con error `SYSTEM_ROLE_PROTECTED`

2. **Intentar cambiar nombre a uno duplicado (debe fallar):**
   ```bash
   curl -X PUT http://localhost:5000/api/v1/roles/23 \
     -b cookies.txt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
     -d '{
       "rol": "MEDICOS"
     }'
   ```
   - Debe retornar: `400 Bad Request` con error `ROLE_NAME_EXISTS`

3. **Actualizar rol inexistente (debe fallar):**
   ```bash
   curl -X PUT http://localhost:5000/api/v1/roles/9999 \
     -b cookies.txt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
     -d '{
       "desc_rol": "Test"
     }'
   ```
   - Debe retornar: `404 Not Found` con error `ROLE_NOT_FOUND`

---

## Test 5: Eliminar Rol (DELETE /api/v1/roles/:id)

**Objetivo:** Verificar que se puede eliminar un rol (baja lógica) si no tiene usuarios asignados.

**Request (eliminar rol creado en Test 3):**
```bash
curl -X DELETE http://localhost:5000/api/v1/roles/23 \
  -b cookies.txt \
  -H "X-CSRF-TOKEN: TU_CSRF_TOKEN" \
  -v
```

**Resultado esperado:**
- Status: `204 No Content`
- Body: (vacío)

**Checklist:**
- [ ] Status 204
- [ ] Body vacío
- [ ] Al listar roles (Test 1), el rol eliminado NO aparece (o aparece con `est_rol='B'`)

**Validaciones a probar:**

1. **Intentar eliminar rol del sistema (debe fallar):**
   ```bash
   curl -X DELETE http://localhost:5000/api/v1/roles/1 \
     -b cookies.txt \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN"
   ```
   - Debe retornar: `403 Forbidden` con error `SYSTEM_ROLE_PROTECTED`

2. **Intentar eliminar rol con usuarios asignados (debe fallar):**
   
   Primero, creá un rol y asignale un usuario manualmente en la BD:
   ```sql
   -- Crear rol
   INSERT INTO cat_roles (rol, desc_rol, landing_route, priority, est_rol)
   VALUES ('ROL_CON_USUARIOS', 'Rol con usuarios', '/test', 999, 'A');
   
   -- Asignar usuario (usa un id_usuario existente)
   INSERT INTO users_roles (id_usuario, id_rol, is_primary, est_usr_rol)
   VALUES (1, LAST_INSERT_ID(), 1, 'A');
   ```
   
   Luego intentá eliminar:
   ```bash
   curl -X DELETE http://localhost:5000/api/v1/roles/[ID_DEL_ROL] \
     -b cookies.txt \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN"
   ```
   - Debe retornar: `400 Bad Request` con error `ROLE_HAS_USERS`

3. **Eliminar rol ya eliminado (debe fallar):**
   ```bash
   curl -X DELETE http://localhost:5000/api/v1/roles/23 \
     -b cookies.txt \
     -H "X-CSRF-TOKEN: TU_CSRF_TOKEN"
   ```
   - Debe retornar: `404 Not Found` con error `ROLE_NOT_FOUND`

---

## Test 6: Verificar Invalidación de Cache

**Objetivo:** Asegurar que el cache de permisos se invalida al modificar roles.

**Pasos:**

1. **Crear un rol nuevo** (Test 3)
2. **Asignarle permisos** (manualmente en BD o esperar a Fase 2)
3. **Verificar que AuthorizationService NO cachea permisos obsoletos**

Este test es más complejo y requiere instrumentar el código o revisar logs.

**Verificación manual en código:**

En `backend/src/infrastructure/security/authorization_service.py`, línea 96-104, el método `invalidate_cache()` debe ejecutarse al:
- Crear rol
- Actualizar rol
- Eliminar rol
- Asignar/revocar permisos (Fase 2)

**Cómo verificar:**

Agregá un print temporal en `invalidate_cache()`:
```python
def invalidate_cache(self):
    print(f"[DEBUG] Cache invalidado para {len(self._cache)} usuarios")
    self._cache.clear()
    self._cache_timestamps.clear()
```

Luego ejecutá Test 3 (crear rol) y verificá que el print aparece en los logs del backend.

---

## Checklist General de Fase 1

- [ ] **Test 1:** GET /api/v1/roles retorna lista de roles
- [ ] **Test 2:** GET /api/v1/roles/:id retorna detalle de rol
- [ ] **Test 3:** POST /api/v1/roles crea rol correctamente
- [ ] **Test 3.1:** POST rechaza nombre duplicado
- [ ] **Test 3.2:** POST rechaza nombre muy largo
- [ ] **Test 3.3:** POST rechaza descripción vacía
- [ ] **Test 3.4:** POST rechaza landing_route inválido
- [ ] **Test 4:** PUT /api/v1/roles/:id actualiza rol
- [ ] **Test 4.1:** PUT rechaza editar rol del sistema (id≤22)
- [ ] **Test 4.2:** PUT rechaza nombre duplicado
- [ ] **Test 4.3:** PUT rechaza rol inexistente
- [ ] **Test 5:** DELETE /api/v1/roles/:id elimina rol sin usuarios
- [ ] **Test 5.1:** DELETE rechaza eliminar rol del sistema (id≤22)
- [ ] **Test 5.2:** DELETE rechaza eliminar rol con usuarios asignados
- [ ] **Test 5.3:** DELETE rechaza eliminar rol ya eliminado
- [ ] **Test 6:** Cache de permisos se invalida al modificar roles

---

## Endpoints Verificados

| Método | Endpoint | Permiso Requerido | Status OK | Status Error |
|--------|----------|-------------------|-----------|--------------|
| POST | /api/v1/roles | roles:create | 201 | 400, 401, 403 |
| GET | /api/v1/roles | roles:read | 200 | 401, 403 |
| GET | /api/v1/roles/:id | roles:read | 200 | 401, 403, 404 |
| PUT | /api/v1/roles/:id | roles:update | 200 | 400, 401, 403, 404 |
| DELETE | /api/v1/roles/:id | roles:delete | 204 | 400, 401, 403, 404 |

---

## Notas Importantes

1. **CSRF Token:** Todos los endpoints mutantes (POST, PUT, DELETE) requieren header `X-CSRF-TOKEN`.
2. **Cookies:** El token JWT está en cookies HttpOnly, envialo con `-b cookies.txt`.
3. **Roles del Sistema:** Los roles con id≤22 están protegidos y NO se pueden editar/eliminar.
4. **Baja Lógica:** DELETE no borra el registro, solo cambia `est_rol='B'`.
5. **Permisos RBAC:** Solo usuarios con roles ADMINISTRADOR (id=22) o MEDICOS (id=1) tienen permisos RBAC por defecto.

---

## Próximos Pasos (Fase 2)

Una vez completado este testing:

1. **Commitear Fase 1** (ver sección de commit en el plan)
2. **Iniciar Fase 2:** CRUD de Permisos
   - Extender `permission_repository.py`
   - Crear use cases: `CreatePermission`, `UpdatePermission`, `DeletePermission`
   - Crear routes para permisos
   - Implementar `AssignPermissionsToRoleUseCase`
