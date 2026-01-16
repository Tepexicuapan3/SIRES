# Testing de Fixes de Seguridad - SIRES

## 🎯 Objetivo
Verificar que las vulnerabilidades #1 y #2 han sido corregidas correctamente.

---

## ✅ Test 1: Usuario Inactivo NO Puede Hacer Login

**Objetivo**: Verificar que usuarios con `est_usuario = 'B'` son rechazados al intentar login.

**Usuario de prueba**: `Nuevo` (id: 15)
- Estado en BD: `est_usuario = 'B'` (Inactivo)
- Contraseña: `123456A=`

**Comando cURL**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"Nuevo","clave":"123456A="}' \
  -v
```

**Resultado Esperado**:
```json
HTTP/1.1 403 Forbidden
{
  "code": "USER_INACTIVE",
  "message": "Usuario inactivo"
}
```

**✅ PASS** / ❌ FAIL: _________________

---

## ✅ Test 2: Usuario Activo Puede Hacer Login Normalmente

**Objetivo**: Verificar que usuarios activos no son afectados por el fix.

**Usuario de prueba**: `ARI` (id: 8)
- Estado en BD: `est_usuario = 'A'` (Activo)
- Contraseña: `123456A=`

**Comando cURL**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"ARI","clave":"123456A="}' \
  -c cookies.txt \
  -v
```

**Resultado Esperado**:
```json
HTTP/1.1 200 OK
{
  "user": {
    "id_usuario": 8,
    "usuario": "ARI",
    ...
  },
  "requires_onboarding": false
}
```

**✅ PASS** / ❌ FAIL: _________________

---

## ✅ Test 3: Admin con DENY Override ES Bloqueado

**Objetivo**: Verificar que admins con DENY en permission_overrides no pueden acceder.

**Setup**: Verificar que usuario `ARI` (ADMINISTRADOR) tiene DENY en `roles:read`

**Comando SQL (Verificación)**:
```sql
-- Verificar override
SELECT u.usuario, p.code, upo.effect 
FROM user_permission_overrides upo
JOIN sy_usuarios u ON upo.id_usuario = u.id_usuario
JOIN cat_permissions p ON upo.id_permission = p.id_permission
WHERE u.usuario = 'ARI' AND p.code = 'roles:read';

-- Si no existe, crear el override:
INSERT INTO user_permission_overrides 
(id_usuario, id_permission, effect, usr_alta, fch_alta)
SELECT 8, id_permission, 'DENY', 'system', NOW()
FROM cat_permissions WHERE code = 'roles:read';
```

**Comando cURL**:
```bash
# Primero hacer login como ARI
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"ARI","clave":"123456A="}' \
  -c cookies_ari.txt

# Extraer CSRF token de las cookies
CSRF_TOKEN=$(grep csrf_access_token cookies_ari.txt | awk '{print $7}')

# Intentar acceder a endpoint protegido
curl -X GET http://localhost:5000/api/v1/roles \
  -b cookies_ari.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
  -v
```

**Resultado Esperado**:
```json
HTTP/1.1 403 Forbidden
{
  "code": "FORBIDDEN",
  "message": "No tenés permiso para realizar esta acción (requiere: roles:read)"
}
```

**✅ PASS** / ❌ FAIL: _________________

---

## ✅ Test 4: Admin Sin DENY Override Tiene Acceso Total

**Objetivo**: Verificar que admins sin overrides siguen teniendo acceso total.

**Usuario de prueba**: `ABELB` (id: 10, ADMINISTRADOR sin overrides)

**Comando SQL (Verificación)**:
```sql
-- Verificar que NO tiene DENY overrides
SELECT COUNT(*) as deny_count
FROM user_permission_overrides upo
WHERE upo.id_usuario = 10 AND upo.effect = 'DENY';
-- Debe retornar 0
```

**Comando cURL**:
```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"ABELB","clave":"SU_PASSWORD"}' \
  -c cookies_abelb.txt

# Extraer CSRF
CSRF_TOKEN=$(grep csrf_access_token cookies_abelb.txt | awk '{print $7}')

# Acceder a roles
curl -X GET http://localhost:5000/api/v1/roles \
  -b cookies_abelb.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"
```

**Resultado Esperado**:
```json
HTTP/1.1 200 OK
{
  "total": 22,
  "roles": [...]
}
```

**✅ PASS** / ❌ FAIL: _________________

---

## ✅ Test 5: Admin con DENY en UN Permiso, Accede a OTROS

**Objetivo**: Verificar que DENY es granular, solo bloquea el permiso específico.

**Usuario**: `ARI` con DENY en `roles:read`

**Comando cURL**:
```bash
# Login como ARI (ya tiene cookies de test anterior)

# Intentar acceder a /users (requiere users:read, NO está denegado)
curl -X GET http://localhost:5000/api/v1/users \
  -b cookies_ari.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"
```

**Resultado Esperado**:
```json
HTTP/1.1 200 OK
{
  "total": 13,
  "users": [...]
}
```

**✅ PASS** / ❌ FAIL: _________________

---

## ✅ Test 6: Usuario Normal con DENY es Bloqueado

**Objetivo**: Verificar que usuarios no-admin también respetan DENY.

**Usuario**: `testmedico` (id: 12, RECEPCION)

**Setup SQL**:
```sql
-- Crear DENY para usuarios:read
INSERT INTO user_permission_overrides 
(id_usuario, id_permission, effect, usr_alta, fch_alta)
SELECT 12, id_permission, 'DENY', 'system', NOW()
FROM cat_permissions WHERE code = 'usuarios:read'
ON DUPLICATE KEY UPDATE effect='DENY';
```

**Comando cURL**:
```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"testmedico","clave":"SU_PASSWORD"}' \
  -c cookies_test.txt

# Intentar acceder a users
curl -X GET http://localhost:5000/api/v1/users \
  -b cookies_test.txt \
  -H "X-CSRF-TOKEN: ..."
```

**Resultado Esperado**:
```json
HTTP/1.1 403 Forbidden
{
  "code": "FORBIDDEN",
  "message": "No tenés permiso para realizar esta acción (requiere: usuarios:read)"
}
```

**✅ PASS** / ❌ FAIL: _________________

---

## ✅ Test 7: Cache de Permisos Invalida Correctamente

**Objetivo**: Verificar que cambios en overrides se reflejan inmediatamente.

**Pasos**:
1. Login como ARI (con DENY roles:read) → debe ser bloqueado en /roles
2. Eliminar DENY override desde SQL
3. Invalidar cache manualmente o esperar TTL
4. Intentar /roles nuevamente → debe tener acceso

**Comandos**:
```bash
# Paso 1: Verificar bloqueo (ya testeado arriba)

# Paso 2: Eliminar DENY
docker exec -it sires-mysql mysql -u sires -p SIRES -e "
  UPDATE user_permission_overrides 
  SET fch_baja = NOW(), usr_baja = 'system' 
  WHERE id_usuario = 8 AND id_permission = (
    SELECT id_permission FROM cat_permissions WHERE code = 'roles:read'
  );
"

# Paso 3: Invalidar cache Redis
docker exec -it sires-redis redis-cli DEL user_permissions:8

# Paso 4: Re-intentar acceso
curl -X GET http://localhost:5000/api/v1/roles \
  -b cookies_ari.txt \
  -H "X-CSRF-TOKEN: $CSRF_TOKEN"
```

**Resultado Esperado**: 200 OK con lista de roles

**✅ PASS** / ❌ FAIL: _________________

---

## 📊 Resumen de Testing

| # | Test | Status | Notas |
|---|------|--------|-------|
| 1 | Usuario inactivo rechazado | ⬜ | |
| 2 | Usuario activo accede normalmente | ⬜ | |
| 3 | Admin con DENY es bloqueado | ⬜ | |
| 4 | Admin sin DENY accede todo | ⬜ | |
| 5 | Admin con DENY parcial accede otros | ⬜ | |
| 6 | Usuario normal con DENY bloqueado | ⬜ | |
| 7 | Cache invalida correctamente | ⬜ | |

**Total PASS**: ___ / 7  
**Total FAIL**: ___ / 7  

---

## 🐛 Issues Encontrados Durante Testing

_(Documentar cualquier comportamiento inesperado aquí)_

---

**Tester**: _________________  
**Fecha**: _________________  
**Versión Backend**: _________________
