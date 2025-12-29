# 🔍 Diagnóstico y Solución Frontend - SIRES RBAC 2.0

## ✅ Problemas Resueltos

### Problema 1: Dependencias Radix UI Faltantes
**Síntoma:** Errores de importación en `label.tsx`, `select.tsx`, `dialog.tsx`

**Causa:** Las dependencias de Radix UI no se habían instalado en el contenedor Docker

**Solución Aplicada:**
```bash
docker-compose exec frontend bun install
docker-compose exec frontend bun add @radix-ui/react-dialog
docker-compose restart frontend
```

**Estado:** ✅ RESUELTO

---

## 🧪 Pasos de Verificación (Hazlo en el Navegador)

### Test 1: Verificar que el Frontend Carga

1. Abrí tu navegador y andá a: `http://localhost:5173`
2. **Esperado:** La página de login debe cargar sin errores en la consola
3. **Si hay errores:** Abrí DevTools (F12) → pestaña "Console" y copiá el error

---

### Test 2: Login como Admin

1. En la página de login, ingresá:
   - Usuario: `testrbac`
   - Password: `Test123!`
2. Click en "Iniciar Sesión"
3. **Esperado:** Redirect automático a `/admin`

**Si no funciona:**
- Abrí DevTools (F12) → pestaña "Network"
- Buscá el request `POST /api/v1/auth/login`
- Verificá el response (debería ser 200 OK)
- Copiá el error si hay

---

### Test 3: Navegar a Crear Usuario

1. Estando logueado como admin, andá a: `http://localhost:5173/admin/usuarios/nuevo`
2. **Esperado:** Formulario de "Crear Usuario" debe cargar

**Si aparece "Acceso Denegado":**
- El usuario `testrbac` no tiene permisos correctos
- Verificá que tenga `is_admin = 1` en la base de datos

**Si aparece error de importación:**
- Abrí DevTools (F12) → pestaña "Console"
- Copiá el mensaje de error exacto

---

### Test 4: Verificar Dropdown de Roles

1. En el formulario de crear usuario, scrolleá hasta el campo "Rol del Usuario"
2. Click en el dropdown
3. **Esperado:** Debe mostrar roles cargados desde la API:
   - ADMINISTRADOR
   - MEDICOS
   - RECEPCION
   - FARMACIA
   - etc.

**Si muestra "Cargando roles..." por mucho tiempo:**
- Abrí DevTools → pestaña "Network"
- Buscá el request `GET /api/v1/permissions/roles`
- Verificá el status code:
  - `401 Unauthorized` → El token JWT expiró, refrescá la página
  - `403 Forbidden` → El usuario no tiene permisos de admin
  - `500 Server Error` → Error en el backend

**Si el dropdown está vacío:**
- Verificá el response del request en Network
- Debería retornar JSON con estructura: `{ total: 8, roles: [...] }`

---

### Test 5: Crear Usuario (Happy Path)

1. Llenà el formulario:
   - Usuario: `testusuario`
   - Expediente: `87654321`
   - Nombre: `Test`
   - Apellido Paterno: `Usuario`
   - Apellido Materno: `Prueba`
   - CURP: `TUPT000101HDFRZN01` (18 caracteres)
   - Email: `test@metro.cdmx.gob.mx`
   - Rol: Seleccionar "Médicos Especialistas"

2. Click en "Crear Usuario"

**Esperado:**
- ✅ Toast verde: "Usuario creado correctamente"
- ✅ Panel amarillo aparece con contraseña temporal visible (ej: `Ab3!xYz9Qw2@`)
- ✅ Botón "Copiar Contraseña" aparece
- ✅ Botón "Crear Otro Usuario" aparece

**Si NO funciona:**

#### Caso A: Nada pasa al hacer click
- Abrí DevTools → Console
- Buscá errores de JavaScript
- Verificá que no haya warnings de Zod validation

#### Caso B: Error "Usuario ya existe" o "Expediente ya existe"
- Normal, significa que el usuario/expediente ya está en la BD
- Cambiá el usuario a `testusuario2` y expediente a `87654322`

#### Caso C: Error de red (Network Error)
- Abrí DevTools → Network
- Buscá el request `POST /api/v1/users`
- Verificá el status code:
  - `400 Bad Request` → Validación falló (revisá el response body)
  - `401 Unauthorized` → Token expirado (refrescá la página)
  - `403 Forbidden` → No tenés permisos de admin
  - `409 Conflict` → Usuario/expediente duplicado
  - `500 Server Error` → Error en el backend (revisá logs)

#### Caso D: Error 500 en el backend
```bash
# Ver logs del backend
docker-compose logs backend --tail 50
```
Buscá el error de Python y copialo.

---

### Test 6: Verificar Usuario en Base de Datos

1. Abrí MySQL Workbench y conectate a `10.15.15.76`
2. Ejecutá:
   ```sql
   USE dbsisem;
   SELECT * FROM sy_usuarios WHERE usuario = 'testusuario';
   ```
3. **Esperado:** Debe aparecer 1 registro con:
   - `usuario = 'testusuario'`
   - `expediente = '87654321'`
   - `est_usuario = 'A'`
   - `clave` (hasheada, NO texto plano)

4. Verificá det_usuarios:
   ```sql
   SELECT * FROM det_usuarios WHERE id_usuario = <id_del_paso_anterior>;
   ```
   - `cambiar_clave = 'T'` (debe cambiar password en primer login)
   - `terminos_acept = 'F'` (no ha aceptado términos)

5. Verificá asignación de rol:
   ```sql
   SELECT * FROM users_roles WHERE id_usuario = <id>;
   ```
   - `id_rol` debe corresponder al rol seleccionado
   - `is_primary = 1`

---

### Test 7: Login con Usuario Nuevo

1. Logout del admin
2. Login con:
   - Usuario: `testusuario`
   - Password: `<la que copiaste del panel amarillo>`
3. **Esperado:**
   - Login exitoso
   - Redirect a página de onboarding (cambiar password)

**Si no funciona:**
- Verificá que copiaste bien la password (es case-sensitive)
- Verificá que el usuario se haya creado correctamente

---

## 🐛 Errores Comunes y Soluciones

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Causa:** Backend no está corriendo o CORS mal configurado

**Solución:**
```bash
docker-compose ps
# Verificar que "sires-backend" esté "Up"

# Si no está corriendo:
docker-compose up -d backend
```

---

### Error: "Failed to fetch" o "Network Error"
**Causa:** Frontend no puede comunicarse con backend

**Verificaciones:**
1. Backend está corriendo: `docker-compose ps`
2. Backend escucha en puerto 5000: `curl http://localhost:5000/api/health`
3. Variable de entorno `VITE_API_URL` correcta:
   ```bash
   docker-compose exec frontend env | grep VITE_API_URL
   # Debe mostrar: VITE_API_URL=http://localhost:5000/api/v1
   ```

**Si `VITE_API_URL` está mal:**
```bash
# Editar frontend/.env
VITE_API_URL=http://localhost:5000/api/v1

# Reiniciar frontend
docker-compose restart frontend
```

---

### Error: "Cannot read property 'roles' of undefined"
**Causa:** El response de la API no tiene la estructura esperada

**Debug:**
1. Abrí DevTools → Network
2. Buscá el request `GET /api/v1/permissions/roles`
3. Click en el request → pestaña "Response"
4. Verificá que tenga esta estructura:
   ```json
   {
     "total": 8,
     "roles": [
       {
         "id_rol": 22,
         "cod_rol": "ADMINISTRADOR",
         "nom_rol": "Administradores del Sistema",
         "landing_route": "/admin",
         "priority": 1,
         "is_admin": 1,
         "permissions_count": 59
       }
     ]
   }
   ```

**Si el response es diferente:**
- Copiá el JSON completo y reportalo

---

### Error: "Zod validation failed"
**Causa:** El formulario tiene campos con formato incorrecto

**Verificaciones:**
- Usuario: 3-20 caracteres
- Expediente: Exactamente 8 dígitos numéricos
- CURP: Exactamente 18 caracteres
- Email: Formato válido (ej: `usuario@dominio.com`)

---

### Error: Panel de password temporal NO aparece
**Causa:** La mutation no está completando exitosamente

**Debug:**
1. Abrí DevTools → Console
2. Buscá mensajes de error después de hacer click en "Crear Usuario"
3. Verificá que el request `POST /api/v1/users` tenga status 201

**Si el status es 201 pero NO aparece el panel:**
- Puede ser un problema de React state
- Abrí DevTools → React DevTools (si lo tenés instalado)
- Buscá el componente `CreateUserPage`
- Verificá el state `tempPassword` (debería tener un string)

---

## 📊 Estado de Servicios

Verificá que todos los servicios estén corriendo:

```bash
docker-compose ps
```

**Output esperado:**
```
NAME             STATUS      PORTS
sires-backend    Up         0.0.0.0:5000->5000/tcp
sires-frontend   Up         0.0.0.0:5173->5173/tcp
sires-redis      Up         0.0.0.0:6379->6379/tcp
```

**Si alguno está "Exited":**
```bash
docker-compose up -d <servicio>
docker-compose logs <servicio> --tail 50
```

---

## 🔧 Comandos de Diagnóstico Útiles

### Ver logs en tiempo real
```bash
# Backend
docker-compose logs backend --tail 50 --follow

# Frontend
docker-compose logs frontend --tail 50 --follow
```

### Reiniciar servicios
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Limpiar cache de Vite (si hay problemas persistentes)
```bash
docker-compose exec frontend rm -rf node_modules/.vite
docker-compose restart frontend
```

### Reinstalar dependencias completas
```bash
docker-compose exec frontend rm -rf node_modules
docker-compose exec frontend bun install
docker-compose restart frontend
```

---

## 📋 Checklist de Verificación Rápida

- [ ] Backend corriendo (`docker-compose ps`)
- [ ] Frontend corriendo (`docker-compose ps`)
- [ ] Login funciona (`testrbac` / `Test123!`)
- [ ] Redirect a `/admin` funciona
- [ ] Página `/admin/usuarios/nuevo` carga
- [ ] Dropdown de roles muestra roles reales
- [ ] Formulario valida correctamente (errores en rojo)
- [ ] Crear usuario muestra toast verde
- [ ] Panel amarillo con password aparece
- [ ] Botón "Copiar Contraseña" funciona
- [ ] Usuario aparece en MySQL
- [ ] Login con usuario nuevo funciona

---

## 🚨 Si Nada Funciona

### Opción 1: Rebuild completo
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Opción 2: Ver errores específicos
1. Copiá el error exacto de DevTools Console
2. Copiá el error de `docker-compose logs backend --tail 50`
3. Copiá el error de `docker-compose logs frontend --tail 50`
4. Reportá los 3 errores

---

## 📞 Información de Contacto (para el reporte)

Cuando reportes un error, incluí:

1. **Qué paso estabas haciendo** (ej: "Tratando de crear usuario")
2. **Qué esperabas que pasara** (ej: "Toast verde y panel con password")
3. **Qué pasó realmente** (ej: "Error 500 en consola")
4. **Screenshots:**
   - DevTools → Console (errores)
   - DevTools → Network → Request específico → Response
5. **Logs:**
   ```bash
   docker-compose logs backend --tail 50 > backend_logs.txt
   docker-compose logs frontend --tail 50 > frontend_logs.txt
   ```

---

**Última actualización:** Después de instalar dependencias Radix UI

**Estado actual:** ✅ Dependencias instaladas, servicios corriendo, listo para testing
