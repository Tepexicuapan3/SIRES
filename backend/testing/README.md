# Testing RBAC CRUD 2.0

Esta carpeta contiene todo el material de testing del sistema RBAC CRUD.

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `RBAC_TESTING_PLAN.md` | Plan completo de testing (4 test suites, 82 tests) |
| `TESTING_RESULTS.md` | Resultados de testing en tiempo real |
| `test_api_automated.py` | Script automatizado para testing de API (22 endpoints) |
| `API_TEST_REPORT.md` | Reporte generado por script automatizado |

---

## 🚀 Guía Rápida

### Prerequisitos

1. **Servicios corriendo:**
   ```bash
   cd C:\Users\USER\Documents\LuisAnt\SIRES
   docker-compose up -d
   ```

2. **Verificar que backend esté levantado:**
   ```bash
   curl http://localhost:5000/api/v1/health
   # Debe retornar: {"status": "ok"}
   ```

3. **Tener credenciales válidas:**
   - Usuario de la base de datos `sy_usuarios`
   - Ejemplos: `40488`, `40041`, `ABELB`, `LUIS`

---

## 🧪 Test Suite 1: Schema de Base de Datos (✅ 100% COMPLETADO)

Ya ejecutado y documentado en `TESTING_RESULTS.md`.

**Resumen:**
- ✅ 15/15 tests pasados
- ✅ Schema correcto (5 tablas RBAC)
- ✅ 23 roles del sistema
- ✅ 69 permisos (68 system)
- ✅ Foreign keys y constraints verificados

---

## 🧪 Test Suite 2: Backend API (⏳ PENDIENTE)

### Método 1: Script Automatizado (Recomendado)

**Instalar dependencias:**
```bash
pip install requests
```

**Ejecutar testing:**
```bash
python backend/testing/test_api_automated.py \
  --usuario=40488 \
  --clave=TU_CONTRASEÑA
```

**Opciones:**
```bash
# Cambiar base URL
python backend/testing/test_api_automated.py \
  --usuario=40488 \
  --clave=PASSWORD \
  --base-url=http://10.15.15.76:5000/api/v1

# Ver ayuda
python backend/testing/test_api_automated.py --help
```

**Output esperado:**
```
============================================================
FASE 1: AUTENTICACIÓN
============================================================

✅ PASADO | Login exitoso
  └─ Usuario: LUIS DAVID | ID: 1
✅ PASADO | CSRF Token obtenido
  └─ Token: eyJ0eXAiOiJKV1QiLCJ...

============================================================
TEST SUITE 2.1: CRUD ROLES
============================================================

✅ PASADO | GET /roles
  └─ Status: 200 | Roles: 23
✅ PASADO | POST /roles (crear rol custom)
  └─ Status: 201 | ID: 24
...
```

**Reporte generado:**
- Archivo: `backend/testing/API_TEST_REPORT.md`
- Formato: Markdown con resumen de cada endpoint

---

### Método 2: Testing Manual con cURL

**1. Login y obtener cookies:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"40488","clave":"PASSWORD"}' \
  -c cookies.txt \
  -v
```

**2. Extraer CSRF token:**
```bash
# En Windows PowerShell:
$csrf = (Get-Content cookies.txt | Select-String "csrf_access_token").ToString().Split("`t")[-1]

# En Linux/Mac:
csrf=$(grep csrf_access_token cookies.txt | cut -f7)
```

**3. Ejecutar requests con cookies:**
```bash
# GET /roles
curl -X GET http://localhost:5000/api/v1/roles \
  -b cookies.txt

# POST /roles (crear rol)
curl -X POST http://localhost:5000/api/v1/roles \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $csrf" \
  -b cookies.txt \
  -d '{
    "nombre": "TEST_ROL",
    "descripcion": "Rol de testing",
    "landing_route": "/test",
    "priority": 100
  }'

# PUT /roles/:id (actualizar rol)
curl -X PUT http://localhost:5000/api/v1/roles/24 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $csrf" \
  -b cookies.txt \
  -d '{"descripcion": "Descripción actualizada"}'

# DELETE /roles/:id (eliminar rol)
curl -X DELETE http://localhost:5000/api/v1/roles/24 \
  -H "X-CSRF-TOKEN: $csrf" \
  -b cookies.txt
```

---

### Método 3: Testing Manual con Postman

**Configuración:**

1. **Importar endpoints:**
   - Crear colección "RBAC CRUD"
   - Base URL: `http://localhost:5000/api/v1`

2. **Login:**
   - Request: `POST /auth/login`
   - Body: `{"usuario": "40488", "clave": "PASSWORD"}`
   - Tests (JavaScript):
     ```javascript
     // Guardar CSRF token
     const csrf = pm.cookies.get("csrf_access_token");
     pm.environment.set("csrf_token", csrf);
     ```

3. **Requests protegidos:**
   - Headers:
     - `Content-Type: application/json`
     - `X-CSRF-TOKEN: {{csrf_token}}`
   - Settings → "Automatically send cookies" ENABLED

---

## 🧪 Test Suite 3: Reglas de Negocio (⏳ PENDIENTE)

Ejecutar manualmente mediante el script automatizado o cURL:

### R1: Roles del sistema NO editables

```bash
# Debe retornar 400/403
curl -X PUT http://localhost:5000/api/v1/roles/1 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $csrf" \
  -b cookies.txt \
  -d '{"descripcion": "Test"}'
```

### R2: Permisos del sistema NO eliminables

```bash
# Debe retornar 403
curl -X DELETE http://localhost:5000/api/v1/permissions/1 \
  -H "X-CSRF-TOKEN: $csrf" \
  -b cookies.txt
```

### R3: Usuario debe tener ≥1 rol

```bash
# Intentar eliminar último rol de usuario → debe fallar
curl -X DELETE http://localhost:5000/api/v1/users/:id/roles/:roleId \
  -H "X-CSRF-TOKEN: $csrf" \
  -b cookies.txt
```

### R4: Solo UN rol primario por usuario

```sql
-- Ejecutar en MySQL
SELECT id_usuario, COUNT(*) as primary_roles
FROM users_roles
WHERE is_primary = 1 AND est_usr_rol = 'A'
GROUP BY id_usuario
HAVING COUNT(*) > 1;

-- Resultado esperado: 0 filas (ningún usuario con >1 rol primario)
```

---

## 🧪 Test Suite 4: Frontend UI (⏳ PENDIENTE)

### Método: Testing Manual

**Prerequisitos:**
```bash
# Abrir navegador en modo incógnito
# URL: http://localhost:5173
```

**Checklist:**

1. **Login:**
   - [ ] Login con usuario válido
   - [ ] Ver dashboard

2. **Módulo Roles:**
   - [ ] Navegar a `/admin/roles`
   - [ ] Ver lista de roles
   - [ ] Buscar rol por nombre
   - [ ] Crear rol nuevo
   - [ ] Editar rol custom
   - [ ] Intentar editar rol sistema (debe mostrar error)
   - [ ] Eliminar rol custom
   - [ ] Asignar permisos a rol

3. **Módulo Permisos:**
   - [ ] Navegar a `/admin/permissions`
   - [ ] Ver lista de permisos
   - [ ] Filtrar por categoría
   - [ ] Crear permiso nuevo
   - [ ] Editar descripción de permiso
   - [ ] Verificar que `code` no sea editable
   - [ ] Eliminar permiso custom

4. **Módulo Usuarios Multi-Rol:**
   - [ ] Navegar a `/admin/users`
   - [ ] Seleccionar usuario
   - [ ] Ver roles asignados
   - [ ] Asignar rol secundario
   - [ ] Cambiar rol primario
   - [ ] Remover rol secundario
   - [ ] Ver permisos efectivos

5. **Permission Overrides:**
   - [ ] Abrir manager de overrides
   - [ ] Crear override temporal (ALLOW)
   - [ ] Crear override DENY
   - [ ] Ver lista de overrides
   - [ ] Eliminar override

**Documentar en:** `TESTING_RESULTS.md` (sección Test Suite 4)

---

## 📊 Interpretación de Resultados

### Script Automatizado

**Output en terminal:**
- ✅ PASADO = Test exitoso
- ❌ FALLADO = Test con error
- ⚠️ SKIP = Test salteado intencionalmente

**Archivo `API_TEST_REPORT.md`:**
```markdown
# RBAC CRUD - Reporte de Testing API

**Total Tests:** 22  
**Pasados:** 20 ✅  
**Fallados:** 2 ❌  
**Cobertura:** 90.9%

---

### GET /roles
**Status:** ✅ PASADO  
**HTTP Code:** 200  

### POST /roles
**Status:** ❌ FALLADO  
**HTTP Code:** 400  
**Error:** Missing required field 'nombre'
```

### Códigos HTTP Esperados

| Operación | Success | Error |
|-----------|---------|-------|
| GET (listar/obtener) | 200 | 404 (not found) |
| POST (crear) | 201 | 400 (validación), 403 (permisos) |
| PUT (actualizar) | 200 | 400 (validación), 403 (system role) |
| DELETE (eliminar) | 200 | 400 (constraint), 403 (system) |

---

## 🐛 Troubleshooting

### Error: "Connection refused"

**Problema:** Backend no está corriendo  
**Solución:**
```bash
docker-compose up backend
# O verificar:
curl http://localhost:5000/api/v1/health
```

---

### Error: "401 Unauthorized"

**Problema:** Token expirado o cookies no enviadas  
**Solución:**
- Re-ejecutar login
- Verificar que `cookies.txt` exista
- En Postman: verificar "Automatically send cookies" habilitado

---

### Error: "403 Missing CSRF token"

**Problema:** Header `X-CSRF-TOKEN` no enviado  
**Solución:**
```bash
# Verificar que el token esté en cookies:
grep csrf_access_token cookies.txt

# Incluir header en request:
-H "X-CSRF-TOKEN: eyJ0eXAiOiJKV1Qi..."
```

---

### Error: "400 Validation error"

**Problema:** Datos inválidos en el body  
**Solución:**
- Verificar formato del JSON
- Verificar campos requeridos según endpoint
- Consultar `backend/docs/api/endpoints.md`

---

## 📚 Documentación Relacionada

- **Plan de Testing:** `RBAC_TESTING_PLAN.md`
- **Resultados:** `TESTING_RESULTS.md`
- **API Docs:** `backend/docs/api/endpoints.md`
- **Guía Implementación:** `backend/docs/guides/rbac-crud-implementation.md`

---

## 🎯 Checklist de Finalización

Antes de dar por terminado el testing:

- [ ] Test Suite 1 (Schema DB) = 100% ✅
- [ ] Test Suite 2 (Backend API) = 100%
- [ ] Test Suite 3 (Reglas Negocio) = 100%
- [ ] Test Suite 4 (Frontend UI) = 100%
- [ ] Reporte `API_TEST_REPORT.md` generado
- [ ] Resultados actualizados en `TESTING_RESULTS.md`
- [ ] Bugs documentados (si hay)
- [ ] Commit de testing creado
- [ ] Merge a `main` aprobado

---

**Última actualización:** 2026-01-06  
**Autor:** Build Agent (OpenCode)
