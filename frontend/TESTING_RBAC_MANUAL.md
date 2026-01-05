# Manual de Testing RBAC 2.0 - Usuarios Mock

> **Estado:** Sistema de mocks RBAC 2.0 integrado con auth.api.ts  
> **Última actualización:** 2026-01-05  
> **Entorno:** Desarrollo con `VITE_USE_MOCKS=true`

---

## ✅ Pre-requisitos

Antes de testear, verificá que:

1. **Dev server corriendo:**
   ```bash
   cd frontend
   bun dev
   # Debería mostrar: http://localhost:5173
   ```

2. **VITE_USE_MOCKS habilitado:**
   ```bash
   # frontend/.env
   VITE_USE_MOCKS=true
   ```

3. **Hard refresh en navegador:**
   - Chrome/Edge: `Ctrl + Shift + R`
   - Firefox: `Ctrl + F5`
   - O abrí en ventana incógnito

4. **Consola del navegador abierta:**
   - `F12` → Pestaña "Console"
   - Vas a ver logs con prefijo `🧪 [MOCK AUTH]`

---

## 🧪 Plan de Testing (10 usuarios + edge cases)

### Test Suite 1: Usuarios RBAC 2.0 (Permisos Reales)

#### Test 1.1: Administrador (Wildcard Permissions) ⭐ CRÍTICO

**Credenciales:**
- Usuario: `admin`
- Password: `Admin123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /admin
✅ Sidebar muestra 7 secciones:
   - Administración
   - Consultas
   - Recepción
   - Urgencias
   - Farmacia
   - Hospital
   - Reportes
✅ Header muestra: "admin ADMINISTRADOR"
✅ Puede acceder a todas las rutas del sistema
```

**Console Log Esperado:**
```
🧪 [MOCK AUTH] Intento de login: admin
🧪 [MOCK AUTH] Login exitoso: {
  usuario: "admin",
  roles: ["ADMINISTRADOR"],
  permissions: 1,  // ["*"] wildcard
  landing: "/admin"
}
```

---

#### Test 1.2: Médico General (15 permisos)

**Credenciales:**
- Usuario: `drgarcia`
- Password: `Doc123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /consultas
✅ Sidebar muestra 3 secciones:
   - Consultas (consultas:*, expedientes:create/update)
   - Expedientes (expedientes:*)
   - Laboratorio (laboratorio:read)
❌ NO muestra: Administración, Recepción, Farmacia, Hospital
✅ Header muestra: "García García MEDICOS"
```

**Permisos asignados (15):**
```
consultas:create
consultas:read
consultas:update
consultas:delete
expedientes:create
expedientes:read
expedientes:update
expedientes:delete
pacientes:read
pacientes:update
laboratorio:read
laboratorio:create
imagenologia:read
imagenologia:create
diagnostico:create
```

---

#### Test 1.3: Recepcionista (10 permisos)

**Credenciales:**
- Usuario: `recep01`
- Password: `Recep123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /recepcion
✅ Sidebar muestra 2 secciones:
   - Recepción (recepcion:*)
   - Expedientes (expedientes:read, expedientes:create)
❌ NO muestra: Administración, Consultas, Farmacia, Urgencias
✅ Header muestra: "Recepción 01 RECEPCION"
```

**Permisos asignados (10):**
```
recepcion:create
recepcion:read
recepcion:update
recepcion:cancel
expedientes:create
expedientes:read
pacientes:read
pacientes:update
citas:create
citas:update
```

---

#### Test 1.4: Farmacéutico (6 permisos)

**Credenciales:**
- Usuario: `farm01`
- Password: `Farm123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /farmacia
✅ Sidebar muestra 2 secciones:
   - Farmacia (farmacia:*)
   - Expedientes (expedientes:read - solo lectura)
❌ NO muestra: Administración, Consultas, Recepción, Urgencias
✅ Header muestra: "Farmacia 01 FARMACIA"
❌ NO puede crear/editar consultas ni expedientes
```

**Permisos asignados (6):**
```
farmacia:create
farmacia:read
farmacia:update
farmacia:dispense
recetas:read
expedientes:read
```

---

#### Test 1.5: Médico de Urgencias (13 permisos)

**Credenciales:**
- Usuario: `urg01`
- Password: `Urg123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /urgencias
✅ Sidebar muestra 4 secciones:
   - Urgencias (urgencias:*)
   - Consultas (consultas:create/read/update)
   - Expedientes (expedientes:*)
   - Laboratorio (laboratorio:read/create - resultados urgentes)
❌ NO muestra: Administración, Recepción, Farmacia
✅ Header muestra: "Urgencias 01 URGENCIAS"
```

**Permisos asignados (13):**
```
urgencias:create
urgencias:read
urgencias:update
urgencias:priority
consultas:create
consultas:read
consultas:update
expedientes:create
expedientes:read
expedientes:update
laboratorio:read
laboratorio:create
diagnostico:create
```

---

#### Test 1.6: Especialista (16 permisos)

**Credenciales:**
- Usuario: `drlopez`
- Password: `Esp123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /consultas
✅ Sidebar muestra 4 secciones:
   - Consultas (consultas:*)
   - Expedientes (expedientes:*)
   - Laboratorio (laboratorio:*)
   - Imagenología (imagenologia:*)
❌ NO muestra: Administración, Recepción, Farmacia
✅ Header muestra: "López López ESPECIALISTAS"
```

**Permisos asignados (16):**
```
consultas:create
consultas:read
consultas:update
consultas:delete
expedientes:create
expedientes:read
expedientes:update
expedientes:delete
pacientes:read
pacientes:update
laboratorio:read
laboratorio:create
laboratorio:approve
imagenologia:read
imagenologia:create
diagnostico:create
```

---

#### Test 1.7: Coordinador Hospital (5 permisos)

**Credenciales:**
- Usuario: `coordhosp`
- Password: `Hosp123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /hospital
✅ Sidebar muestra 2 secciones:
   - Hospital (hospital:*)
   - Expedientes (expedientes:read - solo lectura)
❌ NO muestra: Administración, Consultas, Farmacia
✅ Header muestra: "Hospital Coordinación HOSP-COORDINACION"
```

**Permisos asignados (5):**
```
hospital:create
hospital:read
hospital:update
hospital:discharge
expedientes:read
```

---

#### Test 1.8: Gerente/Director (11 permisos)

**Credenciales:**
- Usuario: `gerente01`
- Password: `Ger123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /reportes
✅ Sidebar muestra 3 secciones:
   - Reportes (reportes:*)
   - Administración (audit:read - solo auditoría)
   - Expedientes (expedientes:read - solo lectura)
❌ NO muestra: Consultas, Farmacia, Urgencias
✅ Header muestra: "Gerencia 01 GERENCIA"
❌ NO puede editar usuarios ni roles (solo ver logs)
```

**Permisos asignados (11):**
```
reportes:create
reportes:read
reportes:update
reportes:export
reportes:schedule
audit:read
users:read
roles:read
expedientes:read
consultas:read
estadisticas:read
```

---

#### Test 1.9: Jefe de Área Clínica (20 permisos)

**Credenciales:**
- Usuario: `jefeclinica`
- Password: `Jefe123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /consultas
✅ Sidebar muestra 6 secciones:
   - Consultas (consultas:*)
   - Expedientes (expedientes:*)
   - Laboratorio (laboratorio:*)
   - Imagenología (imagenologia:*)
   - Reportes (reportes:read/export)
   - Administración (users:read, audit:read - solo lectura)
❌ NO muestra: Recepción, Farmacia (a menos que tengan permisos)
✅ Header muestra: "Jefatura Clínica JEFATURA CLINICA"
```

**Permisos asignados (20):**
```
consultas:create
consultas:read
consultas:update
consultas:delete
expedientes:create
expedientes:read
expedientes:update
expedientes:delete
pacientes:read
pacientes:update
laboratorio:read
laboratorio:create
laboratorio:approve
imagenologia:read
imagenologia:create
diagnostico:create
reportes:read
reportes:export
users:read
audit:read
```

---

#### Test 1.10: Transcriptor de Recetas (5 permisos)

**Credenciales:**
- Usuario: `trans01`
- Password: `Trans123!`

**Resultado Esperado:**
```
✅ Login exitoso
✅ Redirect a /farmacia
✅ Sidebar muestra 2 secciones:
   - Farmacia (recetas:create/read)
   - Expedientes (expedientes:read - solo lectura para ver recetas)
❌ NO muestra: Administración, Consultas, Urgencias
✅ Header muestra: "Transcriptor 01 TRANS-RECETA"
❌ NO puede dispensar medicamentos (solo transcribir recetas)
```

**Permisos asignados (5):**
```
recetas:create
recetas:read
recetas:update
expedientes:read
farmacia:read
```

---

### Test Suite 2: Usuarios de Error (Edge Cases)

#### Test 2.1: Usuario Inactivo

**Credenciales:**
- Usuario: `inactivo`
- Password: `cualquiera`

**Resultado Esperado:**
```
❌ Login falla
❌ Toast muestra: "El usuario está deshabilitado administrativamente."
❌ Status HTTP: 403 FORBIDDEN
❌ Error code: USER_INACTIVE
```

---

#### Test 2.2: Usuario No Existe

**Credenciales:**
- Usuario: `noexiste`
- Password: `cualquiera`

**Resultado Esperado:**
```
❌ Login falla
❌ Toast muestra: "El usuario ingresado no existe en el sistema."
❌ Status HTTP: 404 NOT FOUND
❌ Error code: USER_NOT_FOUND
```

---

#### Test 2.3: Credenciales Inválidas

**Credenciales:**
- Usuario: `admin`
- Password: `mal`

**Resultado Esperado:**
```
❌ Login falla
❌ Toast muestra: "Usuario o contraseña incorrectos."
❌ Status HTTP: 401 UNAUTHORIZED
❌ Error code: INVALID_CREDENTIALS
```

---

#### Test 2.4: Usuario Bloqueado (5 minutos)

**Credenciales:**
- Usuario: `bloqueado`
- Password: `cualquiera`

**Resultado Esperado:**
```
❌ Login falla
❌ Toast muestra contador regresivo: "Usuario bloqueado. Intenta nuevamente en 5:00"
❌ Status HTTP: 423 LOCKED
❌ Error code: USER_LOCKED
❌ retry_after: 300 segundos
```

---

#### Test 2.5: Rate Limit (Demasiadas Peticiones)

**Credenciales:**
- Usuario: `ratelimit`
- Password: `cualquiera`

**Resultado Esperado:**
```
❌ Login falla
❌ Toast muestra contador: "Demasiadas solicitudes. Intenta nuevamente en 1:00"
❌ Status HTTP: 429 TOO MANY REQUESTS
❌ Error code: TOO_MANY_REQUESTS
❌ retry_after: 60 segundos
```

---

#### Test 2.6: IP Bloqueada

**Credenciales:**
- Usuario: `ipblock`
- Password: `cualquiera`

**Resultado Esperado:**
```
❌ Login falla
❌ Toast muestra: "Tu dirección IP ha sido bloqueada temporalmente. Intenta nuevamente en 15:00"
❌ Status HTTP: 403 FORBIDDEN
❌ Error code: IP_BLOCKED
❌ retry_after: 900 segundos
```

---

### Test Suite 3: Protección de Rutas (RBAC Enforcement)

#### Test 3.1: Recepcionista intenta acceder a /admin

**Setup:**
1. Loguearse como `recep01` / `Recep123!`
2. En navegador, ir manualmente a: `http://localhost:5173/admin`

**Resultado Esperado:**
```
❌ Acceso denegado
✅ Redirect a /dashboard o /recepcion
✅ Toast muestra: "No tenés permisos para acceder a esta sección"
```

---

#### Test 3.2: Farmacéutico intenta acceder a /consultas/nueva

**Setup:**
1. Loguearse como `farm01` / `Farm123!`
2. En navegador, ir manualmente a: `http://localhost:5173/consultas/nueva`

**Resultado Esperado:**
```
❌ Acceso denegado
✅ Redirect a /dashboard o /farmacia
✅ Toast muestra: "No tenés permisos para acceder a esta sección"
```

---

#### Test 3.3: Médico intenta acceder a /admin/usuarios

**Setup:**
1. Loguearse como `drgarcia` / `Doc123!`
2. En navegador, ir manualmente a: `http://localhost:5173/admin/usuarios`

**Resultado Esperado:**
```
❌ Acceso denegado
✅ Redirect a /dashboard o /consultas
✅ Toast muestra: "No tenés permisos para acceder a esta sección"
```

---

#### Test 3.4: Gerente puede ver audit logs pero NO editar usuarios

**Setup:**
1. Loguearse como `gerente01` / `Ger123!`
2. Ir a `/admin/audit` (debería funcionar)
3. Intentar ir a `/admin/usuarios/crear` (debería bloquear)

**Resultado Esperado:**
```
✅ /admin/audit → Acceso permitido (tiene audit:read)
❌ /admin/usuarios/crear → Acceso denegado (NO tiene users:create)
```

---

### Test Suite 4: Landing Routes (Redirección Automática)

#### Test 4.1: Admin → /admin

**Credenciales:** `admin` / `Admin123!`  
**Landing esperado:** `/admin`

---

#### Test 4.2: Médico → /consultas

**Credenciales:** `drgarcia` / `Doc123!`  
**Landing esperado:** `/consultas`

---

#### Test 4.3: Recepcionista → /recepcion

**Credenciales:** `recep01` / `Recep123!`  
**Landing esperado:** `/recepcion` (placeholder "En desarrollo")

---

#### Test 4.4: Farmacéutico → /farmacia

**Credenciales:** `farm01` / `Farm123!`  
**Landing esperado:** `/farmacia` (placeholder "En desarrollo")

---

#### Test 4.5: Urgencias → /urgencias

**Credenciales:** `urg01` / `Urg123!`  
**Landing esperado:** `/urgencias` (placeholder "En desarrollo")

---

#### Test 4.6: Gerente → /reportes

**Credenciales:** `gerente01` / `Ger123!`  
**Landing esperado:** `/reportes` (placeholder "En desarrollo")

---

### Test Suite 5: Navegación y UI

#### Test 5.1: Sidebar filtra correctamente por permisos

**Setup:** Loguearse con diferentes usuarios y contar secciones del sidebar

**Matriz esperada:**

| Usuario       | Secciones Visibles | Count |
|---------------|--------------------|-------|
| admin         | Todas              | 7+    |
| drgarcia      | Consultas, Expedientes, Laboratorio | 3 |
| recep01       | Recepción, Expedientes | 2 |
| farm01        | Farmacia, Expedientes (read-only) | 2 |
| urg01         | Urgencias, Consultas, Expedientes, Laboratorio | 4 |
| gerente01     | Reportes, Administración (audit), Expedientes | 3 |
| jefeclinica   | Consultas, Expedientes, Laboratorio, Imagenología, Reportes, Admin (read) | 6 |

---

#### Test 5.2: Placeholder pages funcionan

**Setup:** Navegar a rutas con PlaceholderPage

**Rutas a testear:**
- `/recepcion`
- `/urgencias`
- `/farmacia`
- `/hospital`
- `/reportes`

**Resultado Esperado:**
```
✅ Muestra icono de construcción
✅ Badge "En desarrollo"
✅ Nombre del módulo correcto
✅ Botón "Volver al Dashboard" funciona
```

---

#### Test 5.3: Logout limpia sesión

**Setup:**
1. Loguearse con cualquier usuario
2. Clickear botón de logout en header

**Resultado Esperado:**
```
✅ Redirect a /login
✅ localStorage.getItem("sires-auth-storage") → null
✅ Zustand authStore.user → null
✅ Zustand authStore.isAuthenticated → false
✅ Toast muestra: "Sesión cerrada correctamente"
```

---

## 📊 Checklist de Validación Final

Marcá cada test completado:

### Usuarios RBAC 2.0
- [ ] Test 1.1: Administrador (wildcard)
- [ ] Test 1.2: Médico General (15 permisos)
- [ ] Test 1.3: Recepcionista (10 permisos)
- [ ] Test 1.4: Farmacéutico (6 permisos)
- [ ] Test 1.5: Médico Urgencias (13 permisos)
- [ ] Test 1.6: Especialista (16 permisos)
- [ ] Test 1.7: Coordinador Hospital (5 permisos)
- [ ] Test 1.8: Gerente (11 permisos)
- [ ] Test 1.9: Jefe Clínica (20 permisos)
- [ ] Test 1.10: Transcriptor Recetas (5 permisos)

### Edge Cases
- [ ] Test 2.1: Usuario Inactivo
- [ ] Test 2.2: Usuario No Existe
- [ ] Test 2.3: Credenciales Inválidas
- [ ] Test 2.4: Usuario Bloqueado
- [ ] Test 2.5: Rate Limit
- [ ] Test 2.6: IP Bloqueada

### Protección de Rutas
- [ ] Test 3.1: Recepcionista → /admin (bloqueado)
- [ ] Test 3.2: Farmacéutico → /consultas (bloqueado)
- [ ] Test 3.3: Médico → /admin (bloqueado)
- [ ] Test 3.4: Gerente → audit (permitido) vs crear usuario (bloqueado)

### Landing Routes
- [ ] Test 4.1-4.6: Todos los usuarios redirigen correctamente

### UI/Navegación
- [ ] Test 5.1: Sidebar filtra correctamente
- [ ] Test 5.2: Placeholder pages funcionan
- [ ] Test 5.3: Logout limpia sesión

---

## 🐛 Debugging Tips

### Ver logs de mock en consola

Abrí DevTools (`F12`) y filtrá por `🧪`:

```javascript
// En Console, filtrá por:
🧪 [MOCK AUTH]
```

Vas a ver logs como:
```
🧪 [MOCK AUTH] Intento de login: recep01
🧪 [MOCK AUTH] Login exitoso: { usuario: "recep01", roles: [...], permissions: 10, landing: "/recepcion" }
```

---

### Verificar permisos del usuario actual

En Console del navegador, ejecutá:

```javascript
// Ver usuario completo
JSON.parse(localStorage.getItem("sires-auth-storage")).state.user

// Ver solo permisos
JSON.parse(localStorage.getItem("sires-auth-storage")).state.user.permissions

// Ver rol
JSON.parse(localStorage.getItem("sires-auth-storage")).state.user.roles
```

---

### Limpiar sesión manualmente

Si necesitás limpiar todo:

```javascript
localStorage.clear()
location.reload()
```

---

### Verificar que está usando mocks

En Console, ejecutá:

```javascript
// Debería retornar "true"
import.meta.env.VITE_USE_MOCKS
```

Si retorna `undefined` o `false`, verificá que:
1. El archivo `frontend/.env` existe
2. Tiene la línea `VITE_USE_MOCKS=true`
3. Reiniciaste el dev server (`bun dev`)

---

## ✅ Criterios de Éxito

El testing será exitoso cuando:

1. ✅ Los 10 usuarios RBAC 2.0 puedan loguearse
2. ✅ Cada usuario vea SOLO las secciones permitidas en sidebar
3. ✅ Usuarios NO puedan acceder a rutas sin permiso (redirect)
4. ✅ Landing routes redirijan correctamente según rol
5. ✅ Placeholder pages se muestren correctamente
6. ✅ Logout limpie la sesión completamente
7. ✅ No haya errores en Console (excepto warnings de bundle size)
8. ✅ Usuarios de error (inactivo, bloqueado, etc.) muestren mensajes correctos

---

## 📝 Reporte de Issues

Si encontrás bugs durante el testing, documentá:

1. **Usuario usado:** (ej: `recep01`)
2. **Acción realizada:** (ej: "Clickeé en sección Administración del sidebar")
3. **Resultado esperado:** (ej: "No debería ver esa sección")
4. **Resultado actual:** (ej: "La sección aparece y puedo acceder")
5. **Console logs:** (pegá los logs de `🧪 [MOCK AUTH]`)
6. **Screenshot:** (si aplica)

---

## 🚀 Siguiente Fase

Después de completar este testing manual:

1. **Documentar resultados** en `TESTING_RESULTS.md`
2. **Corregir bugs** encontrados
3. **Implementar tests automatizados** (Vitest + React Testing Library)
4. **Integrar con backend real** (desactivar mocks en producción)

---

**Happy Testing! 🎉**
