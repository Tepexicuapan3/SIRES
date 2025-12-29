# Testing: Creación de Usuario (Fix CORS 308 Aplicado)

## Fix Aplicado

**Cambio:** `backend/src/__init__.py` línea 10
```python
app.url_map.strict_slashes = False
```

**Impacto:** Flask ahora acepta URLs con y sin trailing slash sin hacer redirect 308.

**Verificación CLI:**
```bash
curl -i -X POST http://localhost:5000/api/v1/users
# Antes: HTTP/1.1 308 PERMANENT REDIRECT
# Ahora: HTTP/1.1 401 UNAUTHORIZED ✅
```

---

## Plan de Testing en Browser

### Pre-requisitos
- Backend reiniciado: ✅ (aplicado a las 17:26)
- Frontend corriendo: ✅ (puerto 5173)
- Redis corriendo: ✅ (puerto 6379)
- `.env` correcto: ✅ (`VITE_API_URL=http://localhost:5000/api/v1`)

### Paso 1: Login como Admin

1. Abrir browser: `http://localhost:5173`
2. Hacer login:
   - **Usuario:** `testrbac`
   - **Password:** `Test123!`
3. **Esperado:** Redirect automático a `/admin`
4. **Verificar:** URL debe ser `http://localhost:5173/admin`

### Paso 2: Navegar a Crear Usuario

1. Click en sidebar: **"Gestión de Usuarios"** → **"Crear Usuario"**
2. **Esperado:** Navegación a `/admin/usuarios/nuevo`
3. **Verificar:** 
   - Formulario visible con 9 campos
   - Dropdown "Rol" carga roles desde API
   - Sin errores CORS en consola

### Paso 3: Llenar Formulario (Datos de Test)

**Datos válidos para testing:**

| Campo | Valor | Validación |
|-------|-------|------------|
| **Usuario** | `testusr001` | 3-50 chars |
| **Expediente** | `12345678` | 8 dígitos |
| **Nombre** | `Juan` | Requerido |
| **Apellido Paterno** | `Pérez` | Requerido |
| **Apellido Materno** | `García` | Opcional |
| **CURP** | `PEGJ900101HDFRZN01` | 18 chars exactos |
| **Email** | `juan.perez@metro.cdmx.gob.mx` | Email válido |
| **Teléfono** | `5512345678` | Opcional |
| **Rol** | Seleccionar: **"Médicos Especialistas"** | Requerido |

**IMPORTANTE:** El CURP debe tener **exactamente 18 caracteres** (el validador Zod rechaza cualquier otro largo).

### Paso 4: Abrir DevTools ANTES de Submit

1. Presionar `F12` (Chrome/Edge) o `Ctrl+Shift+I`
2. Ir a tab **"Network"**
3. Filtrar por: `users`
4. Dejar abierto para monitorear el request

### Paso 5: Submit y Observar Network

1. Click en botón **"Crear Usuario"**
2. **Observar en Network tab:**
   - Request: `POST http://localhost:5000/api/v1/users`
   - Status: **201 Created** (éxito) o **400/500** (error de validación/BD)
   - **NO debe haber:** `308 PERMANENT REDIRECT`
   - **NO debe haber:** Error CORS en consola

3. **Ver Request Headers:**
   ```
   Content-Type: application/json
   X-CSRF-TOKEN: [token desde cookie]
   Cookie: access_token=...; csrf_access_token=...
   ```

4. **Ver Response:**
   ```json
   {
     "user": {
       "id_usuario": 123,
       "usuario": "testusr001",
       "temp_password": "Abc123!@#XyZ",
       "must_change_password": true
     }
   }
   ```

### Paso 6: Verificar UI Response

**Si éxito (201):**

1. ✅ **Toast verde** aparece: "Usuario creado exitosamente"
2. ✅ **Panel amarillo** aparece con:
   - Título: "⚠️ Contraseña Temporal Generada"
   - Password visible: `Abc123!@#XyZ` (12 chars random)
   - Botón "Copiar Contraseña"
   - Mensaje: "Esta contraseña solo se muestra una vez..."
3. ✅ Formulario se limpia y vuelve al estado inicial
4. ✅ Dropdown de roles se recarga

**Si error (400/422):**

1. 🔴 **Toast rojo** aparece con mensaje de error:
   - `"El usuario ya existe"` (código `USER_EXISTS`)
   - `"El expediente ya está asignado"` (código `EXPEDIENTE_EXISTS`)
   - `"Error de validación"` (código `VALIDATION_ERROR`)

**Si error (500):**

1. 🔴 Toast rojo: "Error interno del servidor"

### Paso 7: Copiar Password Temporal

1. Click en botón **"Copiar Contraseña"**
2. **Esperado:** Toast de confirmación: "Contraseña copiada al portapapeles"
3. Guardar la password en un archivo temporal (necesaria para próximo test)

### Paso 8: Verificar en Base de Datos (Opcional)

```bash
# Conectarse a MySQL
docker exec -it sires-backend mysql -h 10.15.15.76 -u sires -p112233 dbsisem

# Verificar usuario creado
SELECT 
  u.id_usuario, 
  u.usuario, 
  d.nombre, 
  d.apPaterno, 
  d.must_change_password,
  r.nombre_rol
FROM sy_usuarios u
JOIN det_usuarios d ON u.id_usuario = d.id_usuario
LEFT JOIN sy_usuario_rol ur ON u.id_usuario = ur.id_usuario
LEFT JOIN sy_roles r ON ur.id_rol = r.id_rol
WHERE u.usuario = 'testusr001';

# Esperado:
# +------------+-------------+--------+-----------+----------------------+---------------------------+
# | id_usuario | usuario     | nombre | apPaterno | must_change_password | nombre_rol                |
# +------------+-------------+--------+-----------+----------------------+---------------------------+
# |        123 | testusr001  | Juan   | Pérez     |                    1 | Médicos Especialistas     |
# +------------+-------------+--------+-----------+----------------------+---------------------------+
```

---

## Casos de Error a Probar

### Test 1: Usuario Duplicado
1. Intentar crear el mismo usuario: `testusr001`
2. **Esperado:** Toast rojo: "El usuario ya existe"
3. **Status:** 409 Conflict

### Test 2: Expediente Duplicado
1. Cambiar usuario a `testusr002` pero usar mismo expediente: `12345678`
2. **Esperado:** Toast rojo: "El expediente ya está asignado a otro usuario"
3. **Status:** 409 Conflict

### Test 3: CURP Inválido
1. Usar CURP de 17 chars: `PEGJ900101HDFRZN0`
2. **Esperado:** Error de validación frontend (Zod), formulario no se envía
3. Mensaje bajo campo: "El CURP debe tener exactamente 18 caracteres"

### Test 4: Email Inválido
1. Usar email sin dominio: `juan.perez`
2. **Esperado:** Error frontend, mensaje: "Email inválido"

### Test 5: Sin Rol Seleccionado
1. Dejar dropdown de rol vacío
2. **Esperado:** Error frontend: "Debes seleccionar un rol"

---

## Checklist de Éxito

- [ ] Login funciona sin errores
- [ ] Navegación a `/admin/usuarios/nuevo` funciona
- [ ] Dropdown de roles carga desde API (no muestra "mock")
- [ ] Formulario valida campos correctamente
- [ ] **POST /api/v1/users NO devuelve 308**
- [ ] Request incluye cookies + CSRF header
- [ ] Response 201 devuelve `temp_password`
- [ ] Panel amarillo muestra password temporal
- [ ] Botón copiar funciona
- [ ] Toast de éxito aparece
- [ ] Usuario aparece en base de datos
- [ ] `must_change_password = 1` en BD
- [ ] Rol asignado correctamente (`is_primary = 1`)

---

## Debugging - Si Falla

### Error: "CORS policy blocked"
```bash
# Verificar que backend tenga strict_slashes=False
docker-compose logs backend | grep "strict_slashes"

# Reintentar
docker-compose restart backend
```

### Error: "CSRF token missing"
```bash
# Verificar que cookie csrf_access_token exista
# En DevTools → Application → Cookies → http://localhost:5173
# Debe haber: csrf_access_token

# Si falta, hacer logout/login
```

### Error: 500 Internal Server Error
```bash
# Ver logs backend
docker-compose logs backend --tail 50

# Buscar traceback Python
```

### Error: "USER_EXISTS" pero es la primera vez
```sql
-- Verificar si usuario ya existe de session anterior
SELECT * FROM sy_usuarios WHERE usuario = 'testusr001';

-- Si existe, borrarlo
DELETE FROM det_usuarios WHERE id_usuario = (SELECT id_usuario FROM sy_usuarios WHERE usuario = 'testusr001');
DELETE FROM sy_usuario_rol WHERE id_usuario = (SELECT id_usuario FROM sy_usuarios WHERE usuario = 'testusr001');
DELETE FROM sy_usuarios WHERE usuario = 'testusr001';
```

---

## Próximos Pasos (Después de Verificar Éxito)

1. **Test de Login con Usuario Nuevo:**
   - Hacer logout de `testrbac`
   - Login con `testusr001` + password temporal
   - **Esperado:** Redirect a `/complete-onboarding`
   - Cambiar password
   - **Esperado:** Redirect a `/consultas` (según rol Médico)

2. **Conectar PermissionsPage con API Real:**
   - Reemplazar `MOCK_ROLES` con `useQuery`
   - Reemplazar `MOCK_PERMISSIONS_BY_CATEGORY` con `useQuery`
   - Implementar assign/revoke permissions con `useMutation`

3. **Crear User List Page:**
   - Nuevo endpoint: `GET /api/v1/users`
   - Tabla con paginación
   - Filtros: por usuario, rol, estado

---

**Status:** ✅ Fix aplicado y verificado vía CLI. Listo para testing en browser.

**Fecha:** 2025-12-29 17:26 UTC
