# Guía de Uso - Sistema RBAC CRUD 2.0

> **TL;DR:** Guía completa para usar el sistema de gestión de roles, permisos y usuarios en SIRES. Incluye flujos de trabajo, ejemplos prácticos y troubleshooting.

## Problema / Contexto

El sistema RBAC 2.0 permite a los administradores gestionar roles, permisos y usuarios de forma dinámica sin necesidad de modificar código. Esta guía explica cómo usar la interfaz completa implementada en las Fases 0-5.

**Audiencia:** Administradores del sistema SIRES con permiso `usuarios:assign_permissions`

---

## Acceso al Sistema

### Requisitos Previos

- Usuario con rol **ADMIN** o permiso `usuarios:assign_permissions`
- Sesión activa en SIRES
- Navegador compatible (Chrome/Firefox/Edge últimas 2 versiones)

### Rutas de Acceso

```
/admin/roles          → Gestión de Roles
/admin/permisos       → Gestión de Permisos
/admin/usuarios       → Gestión de Usuarios
```

---

## Gestión de Roles

### Ver Lista de Roles

**Ruta:** `/admin/roles`

**Qué ves:**
- Tabla con todos los roles del sistema
- Columnas: Rol, Código, Permisos asignados, Prioridad, Tipo (Admin/Sistema/Custom)
- Badge **"Sistema"** para roles protegidos (id_rol ≤ 22)

**Acciones disponibles:**
- **Ver Detalle:** Muestra permisos asignados al rol
- **Editar:** Solo para roles custom (sistema protegidos)
- **Eliminar:** Solo para roles custom

---

### Crear Nuevo Rol

**Pasos:**

1. Click en **"Crear Rol"** (botón naranja superior derecho)
2. Completar formulario:
   - **Nombre:** Texto en MAYÚSCULAS, máx 50 caracteres (ej: `ENFERMERO_JEFE`)
   - **Descripción:** Opcional, explicación del rol
   - **Ruta de Landing:** Ruta inicial después del login (ej: `/consultas`)
   - **Prioridad:** Número 1-999 (menor = mayor prioridad)
   - **¿Es Admin?:** Checkbox (solo disponible al crear)
3. Click en **"Crear Rol"**

**Resultado:**
- Rol creado aparece en la lista
- Toast de confirmación
- Redirección automática a la lista

**Ejemplo real:**

```
Nombre: COORDINADOR_FARMACIA
Descripción: Coordinador de farmacia con permisos de gestión de inventario
Landing Route: /farmacia
Priority: 150
Is Admin: false
```

---

### Editar Rol Existente

**Restricciones:**
- ❌ **NO** se pueden editar roles del sistema (id_rol ≤ 22)
- ✅ Solo roles custom creados manualmente

**Pasos:**

1. En la lista, click en **"Editar"** del rol deseado
2. Modificar campos permitidos:
   - Descripción
   - Landing route
   - Prioridad
   - ⚠️ **Nombre NO es editable** (es identificador)
   - ⚠️ **Is Admin NO es editable** (decisión de diseño)
3. Click en **"Guardar Cambios"**

**Nota:** Si necesitás cambiar nombre o is_admin, debés crear un nuevo rol y migrar usuarios.

---

### Gestionar Permisos de un Rol

**Pasos:**

1. En la lista de roles, click en **"Ver Detalle"**
2. Se abre la vista de permisos asignados
3. **Asignar nuevos permisos:**
   - Click en **"Asignar Permisos"**
   - Filtrar por categoría (RBAC, EXPEDIENTES, CONSULTAS, etc.)
   - Seleccionar checkboxes de permisos deseados
   - Click en **"Asignar X permiso(s)"**
4. **Revocar permiso:**
   - Click en **"Revocar"** junto al permiso
   - Confirmar en el dialog

**Ejemplo práctico:**

Crear rol `MÉDICO_CONSULTA_EXTERNA` con permisos:
- `consultas:read` (ver consultas)
- `consultas:create` (crear consultas)
- `expedientes:read` (leer expedientes)
- `recetas:generar` (generar recetas)

**Flujo:**
1. Crear rol (prioridad 200, landing `/consultas`)
2. Ver detalle → Asignar Permisos
3. Filtrar por "CONSULTAS" → seleccionar `consultas:read`, `consultas:create`
4. Filtrar por "EXPEDIENTES" → seleccionar `expedientes:read`
5. Filtrar por "FARMACIA" → seleccionar `recetas:generar`
6. Asignar → Confirmar

---

### Eliminar Rol

**Restricciones:**
- ❌ **NO** se pueden eliminar roles del sistema
- ⚠️ Si hay usuarios con este rol, primero asignarles otro rol

**Pasos:**

1. Click en **"Eliminar"** en la lista
2. Confirmar en el dialog de advertencia
3. El rol desaparece de la lista

**Error común:** "Este rol está asignado a N usuarios"
**Solución:** Ir a `/admin/usuarios`, buscar usuarios con ese rol, asignarles otro rol primero.

---

## Gestión de Permisos

### Ver Lista de Permisos

**Ruta:** `/admin/permisos`

**Qué ves:**
- Selector de categoría (filtro rápido)
- Tabla: Código, Recurso, Acción, Descripción, Categoría, Tipo
- Badge **"Sistema"** para permisos protegidos (is_system=true)

**Categorías disponibles:**
- RBAC (gestión de roles/permisos)
- EXPEDIENTES (historias clínicas)
- CONSULTAS (atención médica)
- USUARIOS (administración)
- REPORTES (estadísticas)
- CONFIGURACION (sistema)
- OTROS (misceláneos)

---

### Crear Nuevo Permiso

**Pasos:**

1. Click en **"Crear Permiso"**
2. Completar formulario:
   - **Código:** Formato `recurso:accion` (ej: `laboratorio:solicitar`)
     * Solo minúsculas y guiones bajos
     * Dos partes separadas por `:`
   - **Descripción:** Qué permite hacer este permiso
   - **Categoría:** Seleccionar de la lista
3. Click en **"Crear Permiso"**

**Ejemplos válidos:**

```
codigo: laboratorio:solicitar
descripcion: Permite solicitar estudios de laboratorio
categoria: LABORATORIO

codigo: licencias:generar
descripcion: Generar licencias médicas
categoria: LICENCIAS

codigo: inventario:ajustar
descripcion: Ajustar stock de inventario farmacia
categoria: FARMACIA
```

**Errores comunes:**

❌ `Laboratorio:Solicitar` → Debe ser minúsculas  
❌ `laboratorio-solicitar` → Debe usar `:`  
❌ `solicitar` → Falta el recurso (debe ser `recurso:accion`)  
✅ `laboratorio:solicitar` → Correcto

---

### Editar Permiso Existente

**Restricciones:**
- ❌ **Código NO es editable** (es la primary key)
- ✅ Solo descripción y categoría

**Pasos:**

1. En la lista, click en **"Editar"**
2. Modificar:
   - Descripción (texto libre)
   - Categoría (selector)
3. Click en **"Guardar Cambios"**

**Caso de uso:** Mejorar descripción de un permiso existente para que sea más clara.

---

### Eliminar Permiso

**Restricciones:**
- ❌ **NO** se pueden eliminar permisos del sistema (is_system=true)
- ⚠️ Si está asignado a roles, se revocará automáticamente

**Pasos:**

1. Click en **"Eliminar"**
2. Confirmar en el dialog
3. El permiso desaparece

**Advertencia:** Esto afectará a todos los usuarios que tenían este permiso a través de sus roles.

---

## Gestión de Usuarios

### Ver Lista de Usuarios

**Ruta:** `/admin/usuarios`

**Qué ves:**
- Buscador (por nombre o número de expediente)
- Tabla: Usuario, Nombre, Expediente, Roles, Estado, Última Sesión
- Roles mostrados como badges (★ indica rol primario)
- Contador: "X de Y usuarios"

**Búsqueda:**
- Escribir en el input
- Filtra en tiempo real (local, sin petición al servidor)
- Busca en nombre completo y número de expediente

---

### Ver Detalle de Usuario

**Pasos:**

1. En la lista, click en **"Ver Detalle"**
2. Se muestra:
   - **Info del usuario:** Username, nombre completo, expediente
   - **Roles asignados:** Card con gestión de roles
   - **Permisos excepcionales:** Card con overrides

**Vista dividida en 3 secciones verticales:**
```
┌─────────────────────────────────────┐
│ Info: @usuario | Nombre | Expediente│
├─────────────────────────────────────┤
│ Gestión de Roles                    │
│ [Asignar] [Cambiar Primario]        │
├─────────────────────────────────────┤
│ Permisos Excepcionales              │
│ [Agregar Override] [Ver Efectivos]  │
└─────────────────────────────────────┘
```

---

### Asignar Roles a un Usuario

**Concepto:** Un usuario puede tener **múltiples roles simultáneamente**. Uno de ellos será el **rol primario** (determina landing page inicial).

**Pasos:**

1. En vista detalle, sección "Roles Asignados"
2. Click en **"Asignar Roles"**
3. Dialog con checkboxes:
   - Seleccionar uno o más roles
   - Solo muestra roles **no asignados** aún
4. Click en **"Asignar X rol(es)"**

**Resultado:**
- Roles aparecen en la card
- Badge especial ★ para el rol primario
- Toast de confirmación

**Ejemplo práctico:**

Usuario `@jperez` necesita acceso a consultas Y farmacia:
1. Asignar rol `MÉDICO` (primario ★)
2. Asignar rol `FARMACIA_CONSULTA` (secundario)
3. Ahora tiene permisos de ambos roles combinados

---

### Cambiar Rol Primario

**Para qué:** El rol primario determina:
- Página inicial después del login (`landing_route`)
- Prioridad predeterminada del usuario

**Pasos:**

1. Click en **"Cambiar Primario"**
2. Dialog con select:
   - Muestra rol primario actual
   - Select con roles asignados (excepto el actual)
3. Seleccionar nuevo rol primario
4. Click en **"Cambiar Rol Primario"**

**Restricción:** Solo podés elegir entre roles **ya asignados** al usuario.

**Ejemplo:**

Usuario con roles:
- MÉDICO ★ (primario actual, landing `/consultas`)
- ADMIN (secundario)

Cambiar primario a ADMIN:
1. Cambiar Primario → Select "ADMIN"
2. Confirmar
3. Ahora ADMIN ★ (landing `/admin`), MÉDICO pasa a secundario

---

### Revocar Rol de un Usuario

**Restricción:** Usuario debe tener **al menos 1 rol** siempre.

**Pasos:**

1. En la lista de roles asignados
2. Click en **"Revocar"** del rol deseado
3. Confirmar en el dialog

**Validaciones:**
- ❌ Si es el único rol → Error: "Asigná otro rol antes de revocar este"
- ✅ Si tiene 2+ roles → Se revoca correctamente
- ⚠️ Si revocás el rol primario → Backend auto-asigna otro como primario

**Ejemplo:**

Usuario con roles:
- MÉDICO ★
- FARMACIA_CONSULTA

Revocar MÉDICO:
1. Click "Revocar" → Confirmar
2. Resultado: Solo queda FARMACIA_CONSULTA ★ (ahora primario)

---

### Agregar Permiso Excepcional (Override)

**Concepto:** Los overrides permiten:
- **ALLOW:** Conceder un permiso que el usuario NO tiene por roles
- **DENY:** Revocar un permiso que el usuario SÍ tiene por roles

**Caso de uso típico:**

- Usuario temporal necesita permiso de auditoría por 7 días (ALLOW con expiración)
- Usuario suspendido no puede eliminar expedientes aunque su rol lo permita (DENY permanente)

**Pasos:**

1. En vista detalle, sección "Permisos Excepcionales"
2. Click en **"Agregar Override"**
3. Completar dialog:
   - **Permiso:** Select con autocomplete (todos los permisos disponibles)
   - **Efecto:** 
     * ✅ CONCEDER (ALLOW) - color verde
     * ❌ DENEGAR (DENY) - color rojo
   - **Fecha Expiración:** (opcional)
     * Dejar vacío = sin expiración
     * Seleccionar fecha = expira automáticamente
     * ⚠️ No permite fechas pasadas
4. Click en **"Agregar Override"**

**Ejemplo 1 - ALLOW temporal:**

```
Usuario: @jperez (rol MÉDICO)
Necesita: Acceso temporal a reportes estadísticos

Override:
  Permiso: reportes:estadisticas
  Efecto: CONCEDER
  Expiración: 2026-01-15
  
Resultado: Puede ver reportes hasta el 15 de enero, luego pierde el permiso automáticamente.
```

**Ejemplo 2 - DENY permanente:**

```
Usuario: @lgarcia (rol ADMIN)
Situación: Suspensión administrativa, no puede eliminar usuarios

Override:
  Permiso: usuarios:delete
  Efecto: DENEGAR
  Expiración: (vacío - sin expiración)
  
Resultado: NO puede eliminar usuarios aunque su rol ADMIN lo permita. DENY tiene prioridad.
```

---

### Ver Permisos Efectivos

**Para qué:** Ver el resultado final de permisos del usuario considerando:
- Permisos de todos sus roles
- Overrides ALLOW
- Overrides DENY (tienen máxima prioridad)

**Pasos:**

1. En sección "Permisos Excepcionales"
2. Click en **"Ver Permisos Efectivos"**
3. Dialog con 2 secciones:
   - ✅ **Permisos Concedidos:** Lista con origen (nombre del rol o "Override ALLOW")
   - ❌ **Permisos Denegados:** Lista de overrides DENY activos

**Ejemplo visual:**

```
Usuario: @mramirez
Roles: MÉDICO, FARMACIA_CONSULTA
Overrides: 
  - ALLOW: reportes:estadisticas (exp: 2026-02-01)
  - DENY: expedientes:delete

Permisos Efectivos:

✅ CONCEDIDOS (15):
  consultas:read (origen: MÉDICO)
  consultas:create (origen: MÉDICO)
  expedientes:read (origen: MÉDICO)
  farmacia:dispensar (origen: FARMACIA_CONSULTA)
  reportes:estadisticas (origen: Override ALLOW)
  ...

❌ DENEGADOS (1):
  expedientes:delete (Override DENY)
```

**Prioridad de permisos:**

```
1. DENY override   ← Mayor prioridad (bloquea todo)
2. ALLOW override  ← Media (sobrescribe roles)
3. Permisos de rol ← Menor (base)
```

---

### Eliminar Override

**Pasos:**

1. En la tabla de overrides
2. Click en **"Eliminar"** del override deseado
3. Confirmar en el dialog

**Resultado:**
- Override desaparece
- Permisos vuelven a ser solo los del rol

**Nota:** Los overrides expirados se muestran con badge "Expirado" y opacidad reducida, pero no aplican automáticamente. Podés eliminarlos manualmente para limpiar la lista.

---

## Flujos de Trabajo Comunes

### Flujo 1: Crear un Nuevo Rol Médico Especializado

**Escenario:** Necesitás crear rol para Médicos de Urgencias con permisos específicos.

**Pasos completos:**

1. **Crear el rol:**
   ```
   /admin/roles → Crear Rol
   Nombre: MEDICO_URGENCIAS
   Descripción: Médico de urgencias con acceso a triage
   Landing: /urgencias
   Priority: 100
   Is Admin: false
   ```

2. **Asignar permisos:**
   ```
   Ver Detalle del rol → Asignar Permisos
   
   Categoría CONSULTAS:
   - consultas:read
   - consultas:create
   - consultas:update
   
   Categoría EXPEDIENTES:
   - expedientes:read
   - expedientes:update
   
   Categoría URGENCIAS:
   - urgencias:atender
   - urgencias:triage
   - urgencias:derivar
   ```

3. **Asignar a usuarios:**
   ```
   /admin/usuarios → Buscar usuario → Ver Detalle
   Asignar Roles → Seleccionar MEDICO_URGENCIAS
   ```

**Resultado:** Rol listo para usar con permisos específicos de urgencias.

---

### Flujo 2: Usuario Temporal con Permisos Limitados

**Escenario:** Usuario externo (auditor) necesita acceso de solo lectura por 30 días.

**Pasos:**

1. **Crear usuario (si no existe):**
   ```
   /admin/usuarios/nuevo
   (Asignar rol básico, ej: USUARIO_BASICO con permisos mínimos)
   ```

2. **Agregar overrides ALLOW temporales:**
   ```
   /admin/usuarios → Ver Detalle del auditor
   
   Agregar Override:
     Permiso: expedientes:read
     Efecto: CONCEDER
     Expiración: 2026-02-06 (30 días)
   
   Agregar Override:
     Permiso: consultas:read
     Efecto: CONCEDER
     Expiración: 2026-02-06
   
   Agregar Override:
     Permiso: reportes:generar
     Efecto: CONCEDER
     Expiración: 2026-02-06
   ```

3. **Verificar permisos efectivos:**
   ```
   Ver Permisos Efectivos → Confirmar que tiene acceso temporal
   ```

**Resultado:** Usuario con acceso temporal que expira automáticamente.

---

### Flujo 3: Suspender Permisos Críticos sin Eliminar Rol

**Escenario:** Usuario bajo investigación no debe poder eliminar/modificar datos.

**Pasos:**

1. **Agregar overrides DENY:**
   ```
   /admin/usuarios → Ver Detalle del usuario
   
   Agregar Override:
     Permiso: expedientes:delete
     Efecto: DENEGAR
     Expiración: (vacío)
   
   Agregar Override:
     Permiso: expedientes:update
     Efecto: DENEGAR
     Expiración: (vacío)
   
   Agregar Override:
     Permiso: usuarios:delete
     Efecto: DENEGAR
     Expiración: (vacío)
   ```

2. **Verificar:**
   ```
   Ver Permisos Efectivos → Confirmar DENY aparece en denegados
   ```

**Resultado:** Usuario mantiene su rol pero pierde permisos críticos.

---

## Troubleshooting

### Problema: "No puedo editar un rol"

**Síntoma:** Botón "Editar" deshabilitado o no aparece.

**Causa:** Rol del sistema (id_rol ≤ 22) protegido.

**Solución:** 
- ✅ Crear un nuevo rol custom con permisos similares
- ❌ No se pueden editar roles del sistema por seguridad

---

### Problema: "No puedo revocar el último rol de un usuario"

**Síntoma:** Error "Usuario debe tener al menos un rol".

**Causa:** Validación de negocio - usuario siempre debe tener ≥1 rol.

**Solución:**
1. Asignar otro rol primero
2. Luego revocar el que querías eliminar

---

### Problema: "El override no está aplicando"

**Síntoma:** Usuario sigue sin tener (o teniendo) el permiso.

**Causas posibles:**

1. **Override expirado:**
   - Verificar: Badge "Expirado" en la tabla
   - Solución: Crear nuevo override con fecha futura

2. **DENY bloqueando ALLOW:**
   - Verificar: Ver Permisos Efectivos → Check sección denegados
   - Solución: Eliminar el override DENY si corresponde

3. **Cache del navegador:**
   - Solución: Recargar página (Ctrl+F5) o logout/login

---

### Problema: "No veo el botón 'Crear Rol/Permiso/Usuario'"

**Síntoma:** Interfaz de solo lectura.

**Causa:** Usuario no tiene permiso `usuarios:assign_permissions`.

**Solución:**
- Pedir a un administrador que te asigne el permiso o rol ADMIN
- Verificar: `/admin/usuarios` → Tu usuario → Ver Permisos Efectivos

---

### Problema: "Error 403 Forbidden al intentar crear rol"

**Síntoma:** Toast de error "No autorizado" o similar.

**Causas posibles:**

1. **Token JWT expirado:**
   - Solución: Logout y login nuevamente

2. **Permisos revocados:**
   - Solución: Contactar administrador

3. **DENY override bloqueando:**
   - Verificar: Ver Permisos Efectivos de tu usuario
   - Solución: Pedir eliminación del override

---

### Problema: "Usuario con múltiples roles, ¿cuál landing se usa?"

**Síntoma:** Confusión sobre dónde redirige después del login.

**Respuesta:** Siempre se usa el `landing_route` del **rol primario** (★).

**Ejemplo:**
```
Usuario con:
- MÉDICO ★ (landing: /consultas)
- FARMACIA (landing: /farmacia)

Login → Redirige a /consultas (del primario)
```

---

## Referencia Rápida

### Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Buscar usuario | Focus en search: `/` |
| Cerrar dialog | `Esc` |
| Confirmar dialog | `Enter` |

### Códigos de Error Comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| 403 | Sin permisos | Verificar rol/permisos |
| 404 | Recurso no encontrado | Verificar ID/código |
| 409 | Conflicto (ej: rol ya existe) | Cambiar nombre |
| 500 | Error del servidor | Reportar a TI |

### Límites del Sistema

| Recurso | Límite |
|---------|--------|
| Nombre de rol | 50 caracteres |
| Código de permiso | 100 caracteres |
| Roles por usuario | Sin límite técnico |
| Overrides por usuario | Sin límite técnico |
| Prioridad de rol | 1-999 |

---

## Referencias

- **Plan de implementación:** `docs/guides/rbac-crud-implementation.md`
- **Arquitectura RBAC:** `docs/architecture/rbac.md`
- **API Endpoints:** `docs/api/endpoints.md`
- **Guía de desarrollo:** `PROJECT_GUIDE.md`
