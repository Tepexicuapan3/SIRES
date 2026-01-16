# 🎉 FASE 2 y FASE 3 - RBAC COMPLETADAS

## 📊 Resumen de Progreso

| Fase | Descripción | Estado | Completado |
|------|-------------|--------|------------|
| **FASE 0** | Verificación del Estado Actual | ✅ COMPLETA | 100% |
| **FASE 1.1** | Corrección Tipos TypeScript | ✅ COMPLETA | 100% |
| **FASE 1.2** | UI Agrupada de Permisos | ✅ COMPLETA | 100% |
| **FASE 2** | Multi-Rol + Rol Principal | ✅ COMPLETA | 100% |
| **FASE 3** | Overrides (ALLOW/DENY) | ✅ COMPLETA | 100% |
| **FASE 4** | Dependencias Automáticas | ⏳ PENDIENTE | 0% |
| **FASE 5** | Sidebar Dinámico | ⏳ PENDIENTE | 0% |
| **FASE 6** | Testing E2E | ⏳ PENDIENTE | 0% |

---

## ✅ FASE 2: Multi-Rol + Rol Principal (COMPLETA)

### Problema Resuelto
❌ **Antes:** Un usuario solo podía tener un rol (limitado)  
✅ **Ahora:** Un usuario puede tener múltiples roles con uno marcado como primario

### Arquitectura Implementada

#### Backend
```
📁 backend/src/
├── use_cases/users/
│   ├── assign_roles_to_user.py       ✅ Asignar múltiples roles
│   ├── set_primary_role.py           ✅ Cambiar rol primario
│   └── revoke_role_from_user.py      ✅ Revocar rol
├── presentation/api/
│   └── users_routes.py               ✅ Endpoints multi-rol
└── infrastructure/repositories/
    └── user_repository.py            ✅ Queries multi-rol
```

**Endpoints:**
- `POST /api/v1/users/<id>/roles` → Asignar múltiples roles (bulk)
- `PATCH /api/v1/users/<id>/roles/primary` → Cambiar rol primario
- `DELETE /api/v1/users/<id>/roles/<role_id>` → Revocar rol

#### Frontend
```
📁 frontend/src/
├── features/admin/
│   ├── hooks/useAdminUsers.ts        ✅ Hooks multi-rol
│   └── components/users/
│       ├── UserRolesManager.tsx      ✅ Componente gestión roles
│       ├── UsersPage.tsx             ✅ Integración en detalle
│       └── UserFormDialog.tsx        ✅ Selector rol inicial
└── api/
    ├── resources/users.api.ts        ✅ API calls
    └── types/users.types.ts          ✅ Tipos multi-rol
```

### Características Implementadas

#### 1. **Gestión de Roles en UI** (`UserRolesManager.tsx`)

**Lista de Roles Actuales:**
```
┌─────────────────────────────────────────────────┐
│ Roles Asignados                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ [MEDICOS] ★ Rol Primario        [Revocar]  │ │
│ │ [ENFERMERIA] Enfermería          [Revocar]  │ │
│ │ [ADMIN] Administrador            [Revocar]  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Cambiar Primario]  [Asignar Roles]            │
└─────────────────────────────────────────────────┘
```

**Dialog: Asignar Múltiples Roles**
```
┌─────────────────────────────────────┐
│ Asignar Roles al Usuario            │
├─────────────────────────────────────┤
│ ☑ Médicos del servicio              │
│ ☐ Enfermería                        │
│ ☐ Administrativos                   │
│ ☐ Farmacia                          │
│                                     │
│        [Cancelar] [Asignar 1 rol]  │
└─────────────────────────────────────┘
```

**Dialog: Cambiar Rol Primario**
```
┌─────────────────────────────────────┐
│ Cambiar Rol Primario                │
├─────────────────────────────────────┤
│ Rol Primario Actual:                │
│ [MEDICOS]                           │
│                                     │
│ Nuevo Rol Primario:                 │
│ [ ENFERMERIA           ▼ ]         │
│                                     │
│   [Cancelar] [Cambiar Rol Primario] │
└─────────────────────────────────────┘
```

#### 2. **Creación de Usuario con Rol Inicial** (`UserFormDialog.tsx`)

```
┌────────────────────────────────────────┐
│ Crear Nuevo Usuario                    │
├────────────────────────────────────────┤
│ Usuario: [jperez        ]              │
│ Expediente: [12345678   ]              │
│ ...                                    │
│                                        │
│ Rol Inicial:                           │
│ [ Médicos del servicio  ▼ ]           │
│ Este será el rol primario del usuario. │
│ Podés asignar más roles después.       │
│                                        │
│         [Cancelar] [Crear Usuario]     │
└────────────────────────────────────────┘
```

### Reglas de Negocio Implementadas

✅ **Usuario debe tener AL MENOS 1 rol activo**
   - No se permite revocar el último rol
   - Validación en backend y frontend

✅ **Solo UN rol puede ser primario** (`is_primary = true`)
   - Al cambiar primario, el anterior se desmarca automáticamente

✅ **Rol primario define `landing_route`**
   - Determina la página inicial al hacer login

✅ **Si se revoca rol primario:**
   - Backend auto-asigna otro rol como primario
   - Nunca queda sin rol primario

✅ **Permisos efectivos = Unión de permisos de TODOS sus roles**
   - Usuario con roles [MEDICOS, ADMIN] tiene permisos de ambos

### Base de Datos

```sql
-- Tabla: users_roles (many-to-many)
users_roles (
  id_usuario INT,
  id_rol INT,
  is_primary BOOLEAN,  ← Solo uno puede ser TRUE
  est_usr_rol CHAR(1), ← 'A' = activo, 'B' = revocado
  usr_alta, fch_alta,
  usr_baja, fch_baja
)

-- Constraint: Solo UN is_primary=true por usuario
-- Implementado a nivel de lógica de negocio
```

---

## ✅ FASE 3: Overrides de Permisos (ALLOW/DENY) - COMPLETA

### Problema Resuelto
❌ **Antes:** Solo podías dar permisos por roles (inflexible)  
✅ **Ahora:** Podés conceder/denegar permisos específicos a usuarios individuales

### ¿Qué son los Overrides?

**Escenario Real:**

```
Usuario: Dr. Juan Pérez
Rol: MEDICOS (tiene expedientes:read, expedientes:update, consultas:create)

Caso 1: DENY Override
  - Queremos que NO pueda editar expedientes (temporalmente)
  - Override: expedientes:update → DENY
  - Resultado: Puede leer pero NO editar

Caso 2: ALLOW Override
  - Queremos que pueda acceder a reportes admin (excepción)
  - Override: reportes:admin → ALLOW
  - Resultado: Tiene permiso aunque su rol no lo incluye
```

### Arquitectura Implementada

#### Backend

**Base de Datos:**
```sql
CREATE TABLE user_permission_overrides (
  id_user_permission_override INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT,
  id_permission INT,
  effect ENUM('ALLOW', 'DENY') NOT NULL,
  expires_at DATETIME NULL,  -- NULL = sin expiración
  usr_alta VARCHAR(50),
  fch_alta DATETIME,
  usr_baja VARCHAR(50),
  fch_baja DATETIME NULL,    -- Soft delete
  
  UNIQUE KEY (id_usuario, id_permission)
);
```

**Endpoints:**
```
POST   /api/v1/permissions/users/<user_id>/overrides
  ↳ Agregar override (ALLOW/DENY)
  Body: {permission_code, effect, expires_at?}
  Requiere: usuarios:update

GET    /api/v1/permissions/users/<user_id>/overrides
  ↳ Listar overrides del usuario
  Requiere: usuarios:read

DELETE /api/v1/permissions/users/<user_id>/overrides/<permission_code>
  ↳ Eliminar override
  Requiere: usuarios:update

GET    /api/v1/permissions/users/<user_id>/effective
  ↳ Permisos efectivos consolidados (roles + overrides)
  Requiere: usuarios:read
```

**Use Cases:**
- `AddUserPermissionOverrideUseCase` ✅
- `RemoveUserPermissionOverrideUseCase` ✅
- `GetUserEffectivePermissionsUseCase` ✅

#### Frontend

**Componente:** `UserPermissionOverrides.tsx` (681 líneas, completo)

**Estructura:**
```
📦 UserPermissionOverrides.tsx
├─ 📋 Lista de overrides actuales (tabla)
├─ 🔵 Dialog: Agregar Override
│  ├─ Select: Permiso (catálogo completo)
│  ├─ Radio: ALLOW / DENY
│  └─ Date: Expiración (opcional)
├─ 👁️ Dialog: Ver Permisos Efectivos
│  ├─ Sección: Permisos Concedidos (verde)
│  └─ Sección: Permisos Denegados (rojo)
└─ 🗑️ Dialog: Confirmar Eliminación
```

### Características Implementadas

#### 1. **Lista de Overrides Actuales**

```
┌──────────────────────────────────────────────────────────────┐
│ Permisos Excepcionales (Overrides)                          │
│ Permisos temporales que sobrescriben los permisos de roles  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Permiso            │ Efecto  │ Expiración │ Estado    │  │
│ ├────────────────────┼─────────┼────────────┼───────────┤  │
│ │ expedientes:delete │ 🔴 DENY │ 31 Dic '26 │ [Activo]  │  │
│ │ reportes:admin     │ 🟢 ALLOW│ Sin expir. │ [Activo]  │  │
│ │ consultas:delete   │ 🔴 DENY │ Expiró     │ [Expirado]│  │
│ └────────────────────┴─────────┴────────────┴───────────┘  │
│                                                              │
│ ℹ️ Prioridad de Permisos:                                   │
│   1. DENY override (mayor prioridad)                        │
│   2. ALLOW override                                         │
│   3. Permisos de roles                                      │
│                                                              │
│        [Ver Permisos Efectivos]  [Agregar Override]         │
└──────────────────────────────────────────────────────────────┘
```

#### 2. **Dialog: Agregar Override**

```
┌─────────────────────────────────────────────┐
│ Agregar Permiso Excepcional                 │
│ Concedé o denegá un permiso específico      │
├─────────────────────────────────────────────┤
│ Permiso:                                    │
│ [ expedientes:delete                    ▼ ] │
│   Eliminar expedientes médicos              │
│                                             │
│ Efecto:                                     │
│ ○ 🟢 CONCEDER                               │
│   Otorgar este permiso aunque no lo tenga   │
│   por rol                                   │
│                                             │
│ ● 🔴 DENEGAR                                │
│   Revocar este permiso aunque lo tenga      │
│   por rol                                   │
│                                             │
│ Fecha de Expiración (opcional):             │
│ [ 2026-12-31 ]                              │
│ Dejá vacío para que no expire nunca        │
│                                             │
│        [Cancelar]  [Agregar Override]       │
└─────────────────────────────────────────────┘
```

#### 3. **Dialog: Ver Permisos Efectivos**

```
┌─────────────────────────────────────────────┐
│ Permisos Efectivos del Usuario              │
│ Consolidación final de roles y overrides    │
├─────────────────────────────────────────────┤
│ 🟢 Permisos Concedidos (45)                 │
│ ┌─────────────────┬─────────────────────┐   │
│ │ expedientes:read│ consultas:create    │   │
│ │ De roles asign. │ De roles asign.     │   │
│ ├─────────────────┼─────────────────────┤   │
│ │ reportes:admin  │ usuarios:read       │   │
│ │ Override ALLOW  │ De roles asign.     │   │
│ └─────────────────┴─────────────────────┘   │
│                                             │
│ 🔴 Permisos Denegados (2)                   │
│ ┌─────────────────┬─────────────────────┐   │
│ │ expedientes:del │ consultas:delete    │   │
│ │ Override DENY   │ Override DENY       │   │
│ └─────────────────┴─────────────────────┘   │
│                                             │
│                     [Cerrar]                │
└─────────────────────────────────────────────┘
```

### Lógica de Resolución de Permisos

```
ALGORITMO: Calcular Permisos Efectivos de Usuario

1. Obtener TODOS los roles activos del usuario
   role_permissions = UNION(permisos de todos sus roles)

2. Obtener overrides activos (no expirados)
   allow_overrides = overrides con effect='ALLOW'
   deny_overrides = overrides con effect='DENY'

3. Calcular permisos finales
   effective_permissions = (role_permissions + allow_overrides) - deny_overrides

PRIORIDAD:
  DENY override > ALLOW override > Permisos de roles

EJEMPLOS:
  - Usuario tiene "expedientes:read" por rol MEDICOS
  - Usuario tiene override DENY "expedientes:read"
  → Resultado: NO tiene permiso (DENY prevalece)

  - Usuario NO tiene "reportes:admin" en ningún rol
  - Usuario tiene override ALLOW "reportes:admin"
  → Resultado: SÍ tiene permiso (ALLOW lo concede)
```

### Reglas de Negocio Implementadas

✅ **DENY tiene prioridad absoluta**
   - Si existe DENY, el usuario NO tiene el permiso (sin excepciones)

✅ **ALLOW concede permisos extras**
   - Permite dar acceso a funciones específicas sin cambiar roles

✅ **Fecha de expiración opcional**
   - `NULL` = sin expiración
   - Fecha futura = override temporal

✅ **No permite fechas pasadas**
   - Validación en frontend: `min={new Date().toISOString()}`
   - Validación en backend: `validateExpirationDate()`

✅ **Overrides expirados se muestran pero no aplican**
   - Badge "Expirado" en la lista
   - NO se incluyen en cálculo de permisos efectivos

✅ **Soft delete** (`fch_baja` en vez de DELETE)
   - Auditoría completa de cambios

### Integración en UsersPage

```tsx
// UsersPage.tsx - Vista Detail
{!isLoadingDetail && !errorDetail && userDetail && (
  <div className="space-y-6">
    {/* 1. Información Básica + Auditoría + Acciones */}
    <UserDetailCard
      user={userDetail}
      onEdit={handleEditUser}
      onActivate={() => setShowActivateDialog(true)}
      onDeactivate={() => setShowDeactivateDialog(true)}
    />

    {/* 2. Gestión de Roles */}
    <UserRolesManager userId={selectedUserId} />

    {/* 3. Gestión de Permisos (Overrides) ✅ */}
    <UserPermissionOverrides userId={selectedUserId} />
  </div>
)}
```

---

## 🧪 Testing

### Tests Unitarios (Backend)

✅ **FASE 2 - Multi-Rol:**
- `tests/unit/use_cases/test_assign_roles_to_user.py`
- `tests/unit/use_cases/test_set_primary_role.py`
- `tests/unit/use_cases/test_revoke_role_from_user.py`

✅ **FASE 3 - Overrides:**
- `tests/unit/use_cases/test_user_permission_overrides.py` (449 líneas)
  - Test agregar ALLOW override ✅
  - Test agregar DENY override ✅
  - Test override con expiración ✅
  - Test eliminar override ✅
  - Test override ya eliminado (error) ✅
- `tests/unit/use_cases/test_get_user_effective_permissions.py` (300 líneas)
  - Test permisos efectivos sin overrides ✅
  - Test con override ALLOW ✅
  - Test con override DENY ✅
  - Test con overrides expirados (ignorados) ✅

### Tests de Integración

✅ `testing/test_permission_overrides_quick.py`
  - Flujo completo: crear override → verificar → eliminar

✅ `testing/test_api_automated.py`
  - `test_permission_overrides_endpoints()` (línea 479)
  - Prueba endpoints POST/GET/DELETE

---

## 🎯 Cómo Probar el Sistema Completo

### 1. Levantar Docker

```bash
docker-compose up -d
```

### 2. Acceder a la Aplicación

```
URL: http://localhost:5173
Usuario: 40488
Password: 12345
```

### 3. Probar FASE 2: Multi-Rol

**Crear Usuario con Rol Inicial:**
1. Click "Crear Usuario"
2. Llenar datos (usuario, expediente, nombre, correo)
3. Seleccionar "Rol Inicial" → **MEDICOS**
4. Click "Crear Usuario"
5. Copiar contraseña temporal
6. ✅ Usuario creado con rol MEDICOS como primario

**Asignar Múltiples Roles:**
1. Ir a "Gestión de Usuarios"
2. Click "Más Detalles" en usuario recién creado
3. En sección "Roles Asignados"
4. Click "Asignar Roles"
5. Seleccionar ☑ ENFERMERIA, ☑ ADMIN
6. Click "Asignar 2 roles"
7. ✅ Usuario ahora tiene 3 roles (MEDICOS ★, ENFERMERIA, ADMIN)

**Cambiar Rol Primario:**
1. Click "Cambiar Primario"
2. Seleccionar "ADMIN"
3. Click "Cambiar Rol Primario"
4. ✅ Ahora ADMIN tiene la estrella ★

**Revocar Rol:**
1. Click "Revocar" en rol ENFERMERIA
2. Confirmar
3. ✅ Rol removido
4. Intentar revocar el último rol → ❌ Error (debe tener al menos 1)

### 4. Probar FASE 3: Overrides

**Agregar Override DENY:**
1. En mismo usuario, scroll a "Permisos Excepcionales (Overrides)"
2. Click "Agregar Override"
3. Permiso: **expedientes:delete**
4. Efecto: **DENEGAR**
5. Fecha: 31/12/2026 (o dejar vacío)
6. Click "Agregar Override"
7. ✅ Override aparece en tabla con badge rojo 🔴 DENY

**Ver Permisos Efectivos:**
1. Click "Ver Permisos Efectivos"
2. Verificar que:
   - Sección "Permisos Concedidos" tiene todos los de MEDICOS + ADMIN
   - Sección "Permisos Denegados" tiene **expedientes:delete**
3. ✅ Consolidación correcta

**Agregar Override ALLOW:**
1. Click "Agregar Override"
2. Permiso: **reportes:admin** (que el usuario NO tiene por rol)
3. Efecto: **CONCEDER**
4. Sin fecha de expiración
5. Click "Agregar Override"
6. ✅ Override aparece con badge verde 🟢 ALLOW

**Eliminar Override:**
1. Click "Eliminar" en override de expedientes:delete
2. Confirmar
3. ✅ Override eliminado
4. "Ver Permisos Efectivos" → expedientes:delete ya NO aparece en denegados

---

## 📚 Archivos Modificados/Creados

### FASE 2: Multi-Rol

**Backend:**
- `backend/src/use_cases/users/assign_roles_to_user.py` ✅
- `backend/src/use_cases/users/set_primary_role.py` ✅
- `backend/src/use_cases/users/revoke_role_from_user.py` ✅
- `backend/src/presentation/api/users_routes.py` (endpoints añadidos) ✅

**Frontend:**
- `frontend/src/features/admin/hooks/useAdminUsers.ts` (hooks añadidos) ✅
- `frontend/src/features/admin/components/users/UserRolesManager.tsx` ✅ (535 líneas)
- `frontend/src/features/admin/components/users/UsersPage.tsx` (integración línea 324) ✅
- `frontend/src/features/admin/components/users/UserFormDialog.tsx` (selector rol líneas 606-656) ✅
- `frontend/src/api/resources/users.api.ts` (métodos añadidos) ✅
- `frontend/src/api/types/users.types.ts` (tipos multi-rol) ✅

### FASE 3: Overrides

**Backend:**
- `backend/migrations/008_user_permission_overrides.sql` ✅
- `backend/src/use_cases/permissions/add_user_permission_override.py` ✅
- `backend/src/use_cases/permissions/remove_user_permission_override.py` ✅
- `backend/src/use_cases/permissions/get_user_effective_permissions.py` ✅
- `backend/src/presentation/api/permissions_routes.py` (endpoints líneas 746-890) ✅
- `backend/src/infrastructure/repositories/permission_repository.py` (métodos añadidos) ✅

**Frontend:**
- `frontend/src/features/admin/components/users/UserPermissionOverrides.tsx` ✅ (681 líneas)
- `frontend/src/features/admin/hooks/useAdminPermissions.ts` (hooks líneas 108-168) ✅
- `frontend/src/api/resources/permissions.api.ts` (métodos líneas 206-264) ✅
- `frontend/src/api/types/permissions.types.ts` (tipos líneas 93-166) ✅

---

## 🚀 Próximas Fases (Roadmap)

### FASE 4: Dependencias Automáticas de Permisos

**Objetivo:** Inferir permisos automáticamente según dependencias lógicas

**Ejemplo:**
```
Si usuario tiene: expedientes:update
Entonces auto-conceder: expedientes:read (implícito)

Si usuario tiene: consultas:delete
Entonces auto-conceder: consultas:read, consultas:update (implícitos)
```

**Implementación Propuesta:**
- Tabla `cat_permission_dependencies` (parent_permission, child_permission)
- Lógica en `GetUserEffectivePermissionsUseCase`
- UI: Mostrar permisos implícitos en gris/secundario

### FASE 5: Sidebar Dinámico según Permisos

**Objetivo:** Ocultar/mostrar opciones de menú según permisos efectivos

**Implementación Propuesta:**
```tsx
// frontend/src/components/layouts/Sidebar.tsx
const { permissions } = useAuth();

const menuItems = [
  { label: "Expedientes", route: "/expedientes", permission: "expedientes:read" },
  { label: "Consultas", route: "/consultas", permission: "consultas:read" },
  { label: "Usuarios", route: "/admin/users", permission: "usuarios:read" },
  // ...
];

const visibleItems = menuItems.filter(item => 
  !item.permission || permissions.includes(item.permission)
);
```

### FASE 6: Testing E2E Completo

**Objetivo:** Pruebas end-to-end con Playwright

**Cobertura:**
- Login con usuario multi-rol
- Navegación según permisos efectivos
- Crear usuario → asignar roles → agregar overrides
- Verificar sidebar dinámico
- Probar expiración de overrides

---

## 📝 Notas Importantes

### Decisiones de Diseño

1. **Multi-Rol con Rol Primario** (FASE 2)
   - **Decisión:** Un usuario puede tener varios roles pero solo uno es primario
   - **Razón:** `landing_route` debe ser determinista (una sola página inicial)
   - **Alternativa descartada:** Múltiples landing routes (confuso para UX)

2. **Overrides con DENY prioritario** (FASE 3)
   - **Decisión:** DENY > ALLOW > Permisos de roles
   - **Razón:** Seguridad - facilitar revocar accesos críticos rápidamente
   - **Ejemplo:** Usuario con rol ADMIN pero DENY en "usuarios:delete" → NO puede eliminar

3. **Fecha de Expiración Opcional**
   - **Decisión:** `expires_at` puede ser NULL (sin expiración)
   - **Razón:** Algunos overrides son permanentes (ej: acceso excepcional a reportes)
   - **Implementación:** Overrides expirados se mantienen en BD pero no aplican

4. **Soft Delete**
   - **Decisión:** `fch_baja` en vez de DELETE físico
   - **Razón:** Auditoría completa - saber quién eliminó qué y cuándo
   - **Implementación:** Queries filtran por `fch_baja IS NULL`

### Lecciones Aprendidas

1. **Tipos TypeScript deben ser 1:1 con Backend**
   - ✅ Corregimos `cod_rol` → `rol`, `nom_rol` → `desc_rol` en FASE 1.1
   - 📚 Aprendizaje: Validar tipos antes de escribir componentes

2. **UI Agrupada > Lista Plana**
   - ✅ Accordion por categoría (FASE 1.2) mejoró UX dramáticamente
   - 📚 Aprendizaje: 68 checkboxes planos = mala UX, acordeones = navegable

3. **Componentes Pesados = Hooks Livianos**
   - ✅ `UserRolesManager` (535 líneas) pero hooks simples y reutilizables
   - 📚 Aprendizaje: Lógica en hooks, UI en componentes

4. **Backend Primero, Frontend Después**
   - ✅ FASE 3 backend ya existía completo (migrations, use cases, tests)
   - 📚 Aprendizaje: Verificar backend antes de escribir frontend

### Errores Comunes Evitados

❌ **No validar último rol al revocar**
   - ✅ Implementamos: `canRevokeRole = userRoles.length > 1`

❌ **Permitir múltiples roles primarios**
   - ✅ Implementamos: Backend valida `is_primary` único

❌ **No mostrar overrides expirados**
   - ✅ Implementamos: Se muestran con badge "Expirado"

❌ **Permitir fechas pasadas en expiración**
   - ✅ Implementamos: Validación `min={new Date()}`

---

## 🎯 Estado Actual del Sistema

### Funcionalidades Operativas ✅

1. **CRUD de Roles** (crear, editar, eliminar, listar)
2. **Asignación de permisos a roles** con UI agrupada por categoría
3. **Selección masiva** de permisos por categoría
4. **Multi-rol completo:**
   - Asignar múltiples roles a usuario
   - Cambiar rol primario
   - Revocar roles (con validación de mínimo 1)
5. **Overrides de permisos:**
   - Agregar ALLOW/DENY con expiración opcional
   - Listar overrides con estado (activo/expirado)
   - Ver permisos efectivos consolidados
   - Eliminar overrides

### Próximos Pasos Inmediatos

1. **Probar en Docker** (manual E2E)
2. **Implementar FASE 4** (dependencias automáticas)
3. **Implementar FASE 5** (sidebar dinámico)
4. **Implementar FASE 6** (tests E2E con Playwright)

---

## 📞 Soporte

Para dudas o issues:
1. Revisar este documento
2. Revisar `PROJECT_GUIDE.md`
3. Revisar tests unitarios en `backend/tests/`
4. Consultar código de ejemplo en componentes

---

**Última actualización:** 2026-01-09  
**Autor:** SIRES Build Agent  
**Estado:** ✅ FASE 2 y FASE 3 COMPLETADAS
