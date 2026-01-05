# RBAC 2.0 - Sistema de Permisos

Control de acceso basado en roles con permisos granulares.

---

## Modelo Conceptual

```
Usuario → Roles (1:N) → Permisos (M:N)
          └─ Rol Primario (landing route)
          └─ Overrides personalizados (ALLOW/DENY)
```

**Formato de permisos:** `{resource}:{action}`
- Ejemplos: `expedientes:create`, `usuarios:delete`, `consultas:read`
- Admin: `*` (wildcard = todos los permisos)

---

## Tablas de Base de Datos

### `cat_roles` - Roles Disponibles

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_rol` | INT PK | ID del rol |
| `rol` | VARCHAR(50) | Código (ej: `MEDICOS`) |
| `desc_rol` | VARCHAR(200) | Descripción |
| `landing_route` | VARCHAR(100) | Ruta post-login (ej: `/consultas`) |
| `priority` | INT | Orden de preferencia |
| `is_admin` | TINYINT | 1=Admin (permisos `*`) |
| `est_rol` | CHAR(1) | `A`=Activo, `B`=Baja |

**Roles especiales:**
- `ADMINISTRADOR` → `is_admin=1`, `landing_route=/admin`
- `MEDICOS` → `landing_route=/consultas`
- `RECEPCION` → `landing_route=/recepcion`

### `cat_permissions` - Catálogo de Permisos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_permission` | INT PK | ID del permiso |
| `permission` | VARCHAR(100) | Código (ej: `expedientes:create`) |
| `category` | VARCHAR(50) | Agrupación (ej: `EXPEDIENTES`) |
| `display_name` | VARCHAR(100) | Nombre UI |
| `description` | VARCHAR(200) | Qué permite hacer |
| `est_permission` | CHAR(1) | `A`=Activo |

**Categorías comunes:**
- `EXPEDIENTES` → create, read, update, delete
- `USUARIOS` → create, read, update, delete
- `CONSULTAS` → read, create
- `REPORTES` → generate, export

### `role_permissions` - Permisos por Rol

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_rol` | INT FK | Rol |
| `id_permission` | INT FK | Permiso asignado |
| `fch_alta` | DATETIME | Fecha asignación |
| `fch_baja` | DATETIME | NULL=Activo |

### `users_roles` - Roles de Usuario

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | INT FK | Usuario |
| `id_rol` | INT FK | Rol asignado |
| `is_primary` | TINYINT | 1=Rol principal (define landing route) |
| `fch_alta` | DATETIME | Fecha asignación |
| `fch_baja` | DATETIME | NULL=Activo |

**Constraints:**
- Un usuario puede tener múltiples roles
- Solo UN rol puede ser `is_primary=1`

### `user_permission_overrides` - Excepciones por Usuario

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | INT FK | Usuario |
| `id_permission` | INT FK | Permiso |
| `override_type` | ENUM | `ALLOW` o `DENY` |
| `fch_alta` | DATETIME | Fecha override |
| `fch_baja` | DATETIME | NULL=Activo |

**Ejemplo:**
- Usuario con rol `MEDICOS` (tiene `expedientes:read`)
- Override: `DENY expedientes:delete` (aunque su rol lo tenga)
- Resultado: NO puede eliminar expedientes

---

## Lógica de Cálculo de Permisos

### Algoritmo (Backend)

```python
# backend/src/infrastructure/authorization/authorization_service.py

def get_user_permissions(id_usuario: int) -> list[str]:
    # 1. Buscar roles del usuario
    roles = get_active_user_roles(id_usuario)
    
    # 2. Verificar si es admin
    if any(role.is_admin for role in roles):
        return ["*"]
    
    # 3. Acumular permisos de roles
    permissions = set()
    for role in roles:
        role_perms = get_role_permissions(role.id_rol)
        permissions.update(role_perms)
    
    # 4. Aplicar overrides
    overrides = get_user_overrides(id_usuario)
    for override in overrides:
        if override.override_type == "DENY":
            permissions.discard(override.permission)
        elif override.override_type == "ALLOW":
            permissions.add(override.permission)
    
    return list(permissions)
```

### Cache (TTL 5min)

```python
# backend/src/infrastructure/authorization/authorization_service.py

# Redis key: permissions:user:{id_usuario}
cache.setex(f"permissions:user:{id_usuario}", 300, json.dumps(permissions))
```

**Invalidación:**
- POST `/api/v1/permissions/cache/invalidate` (admin only)
- Se ejecuta automáticamente al cambiar roles/permisos

---

## Backend - Protección de Endpoints

### Decoradores Disponibles

#### `@admin_required`
Solo admins (`is_admin=1`):

```python
# backend/src/infrastructure/authorization/decorators.py
from src.infrastructure.authorization.decorators import admin_required

@permissions_bp.route("/roles", methods=["GET"])
@admin_required
def get_roles():
    # Solo admins acceden aquí
    pass
```

#### `@requires_permission("permiso")`
Valida permiso específico:

```python
from src.infrastructure.authorization.decorators import requires_permission

@consultas_bp.route("/nueva", methods=["POST"])
@requires_permission("consultas:create")
def create_consulta():
    # Solo quien tenga consultas:create
    pass
```

#### `@requires_any_permission(["p1", "p2"])`
OR lógico:

```python
@requires_any_permission(["expedientes:read", "expedientes:update"])
def view_expediente(id):
    # Necesita AL MENOS uno de los dos
    pass
```

#### `@requires_all_permissions(["p1", "p2"])`
AND lógico:

```python
@requires_all_permissions(["expedientes:read", "expedientes:export"])
def export_expediente(id):
    # Necesita AMBOS permisos
    pass
```

### Ejemplo Completo

```python
# backend/src/presentation/api/expedientes_routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.infrastructure.authorization.decorators import requires_permission

expedientes_bp = Blueprint("expedientes", __name__)

@expedientes_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
@requires_permission("expedientes:read")
def get_expediente(id):
    # Solo con permisos de lectura
    return jsonify({"id": id, "data": "..."})

@expedientes_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
@requires_permission("expedientes:delete")
def delete_expediente(id):
    # Solo con permisos de borrado
    return jsonify({"message": "Eliminado"})
```

---

## Frontend - Uso de Permisos

### Hook `usePermissions`

```tsx
// frontend/src/features/auth/hooks/usePermissions.ts
import { usePermissions } from "@features/auth/hooks/usePermissions";

function MyComponent() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } = usePermissions();
  
  // Verificar permiso único
  if (hasPermission("expedientes:create")) {
    // Mostrar botón "Nuevo Expediente"
  }
  
  // Verificar múltiples (OR)
  if (hasAnyPermission(["usuarios:read", "usuarios:update"])) {
    // Mostrar sección de usuarios
  }
  
  // Verificar múltiples (AND)
  if (hasAllPermissions(["reportes:generate", "reportes:export"])) {
    // Mostrar botón de exportar
  }
  
  // Verificar admin
  if (isAdmin) {
    // Mostrar panel de administración
  }
}
```

### Componente `<PermissionGate>`

Renderizado condicional:

```tsx
// frontend/src/components/shared/PermissionGate.tsx
import { PermissionGate } from "@/components/shared/PermissionGate";

// Permiso único
<PermissionGate permission="usuarios:create">
  <Button onClick={handleCreate}>Crear Usuario</Button>
</PermissionGate>

// Múltiples permisos (OR)
<PermissionGate anyOf={["expedientes:read", "expedientes:update"]}>
  <ExpedientesList />
</PermissionGate>

// Múltiples permisos (AND)
<PermissionGate allOf={["reportes:generate", "reportes:export"]}>
  <ExportButton />
</PermissionGate>

// Solo admins
<PermissionGate requireAdmin>
  <AdminPanel />
</PermissionGate>

// Fallback si no tiene permiso
<PermissionGate permission="expedientes:create" fallback={<p>Sin acceso</p>}>
  <CreateExpedienteForm />
</PermissionGate>
```

### Rutas Protegidas

```tsx
// frontend/src/routes/Routes.tsx
import { ProtectedRoute } from "@/routes/ProtectedRoute";

<Route
  path="/admin/usuarios"
  element={
    <ProtectedRoute requiredPermission="usuarios:read">
      <UsersPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin"
  element={
    <ProtectedRoute requiredPermission="*">
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

---

## Flujo Completo: Login con RBAC

### 1. Usuario ingresa credenciales

```tsx
// frontend/src/features/auth/components/LoginForm.tsx
mutate({ usuario: "jperez", clave: "Test123!" });
```

### 2. Backend valida y retorna permisos

```python
# backend/src/use_cases/auth/login_usecase.py
permissions = self.auth_service.get_user_permissions(user_id)
landing_route = self.user_repo.get_primary_role_landing(user_id)
is_admin = "*" in permissions

return {
    "user": {
        "id_usuario": user_id,
        "usuario": usuario,
        "permissions": permissions,
        "landing_route": landing_route,
        "is_admin": is_admin,
    },
    "access_token": token,
}, None
```

### 3. Frontend guarda user en Zustand

```tsx
// frontend/src/features/auth/hooks/useLogin.ts
onSuccess: (data) => {
  setUser(data.user);  // Zustand
  navigate(data.user.landing_route);  // Redirect dinámico
};
```

### 4. Usuario navega → Guard verifica permisos

```tsx
// frontend/src/routes/ProtectedRoute.tsx
if (requiredPermission && !hasPermission(requiredPermission)) {
  return <Navigate to="/acceso-denegado" />;
}
```

---

## Gestión de Permisos (Admin)

### Asignar Permiso a Rol

**Endpoint:** `POST /api/v1/permissions/role/:id/assign`

**Request:**
```json
{
  "permission_id": 5
}
```

**Response:**
```json
{
  "message": "Permiso asignado correctamente",
  "role_id": 2,
  "permission_id": 5
}
```

### Revocar Permiso de Rol

**Endpoint:** `POST /api/v1/permissions/role/:id/revoke`

**Request:**
```json
{
  "permission_id": 5
}
```

**Response:**
```json
{
  "message": "Permiso revocado correctamente"
}
```

### Listar Permisos de Rol

**Endpoint:** `GET /api/v1/permissions/role/:id`

**Response:**
```json
{
  "role": {
    "id_rol": 2,
    "rol": "MEDICOS",
    "desc_rol": "Médicos Especialistas"
  },
  "permissions": [
    {
      "id_permission": 1,
      "permission": "expedientes:read",
      "category": "EXPEDIENTES",
      "display_name": "Ver expedientes"
    }
  ]
}
```

---

## Crear Usuario con Rol

**Endpoint:** `POST /api/v1/users`

**Request:**
```json
{
  "usuario": "jperez",
  "expediente": "12345678",
  "nombre": "Juan",
  "paterno": "Pérez",
  "materno": "García",
  "curp": "PEGJ900101HDFRXX00",
  "correo": "jperez@metro.cdmx.gob.mx",
  "id_rol": 2
}
```

**Response:**
```json
{
  "message": "Usuario creado correctamente. La contraseña temporal debe ser entregada al usuario de forma segura.",
  "user": {
    "id_usuario": 123,
    "usuario": "jperez",
    "expediente": "12345678",
    "temp_password": "Ab3!xYz9Qw2@",
    "must_change_password": true,
    "rol_asignado": 2
  }
}
```

**⚠️ Seguridad:**
- Password temporal se genera con `secrets` (criptográficamente seguro)
- Solo se retorna UNA VEZ en el response
- Usuario DEBE cambiarla en primer login (`must_change_password=true`)

---

## Migraciones SQL

### Crear Tablas RBAC 2.0

```sql
-- Roles
CREATE TABLE cat_roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    rol VARCHAR(50) UNIQUE NOT NULL,
    desc_rol VARCHAR(200) NOT NULL,
    landing_route VARCHAR(100) DEFAULT '/',
    priority INT DEFAULT 100,
    is_admin TINYINT DEFAULT 0,
    est_rol CHAR(1) DEFAULT 'A',
    usr_alta VARCHAR(20),
    fch_alta DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Permisos
CREATE TABLE cat_permissions (
    id_permission INT AUTO_INCREMENT PRIMARY KEY,
    permission VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    est_permission CHAR(1) DEFAULT 'A',
    usr_alta VARCHAR(20),
    fch_alta DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Roles ↔ Permisos
CREATE TABLE role_permissions (
    id_rol INT NOT NULL,
    id_permission INT NOT NULL,
    fch_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    fch_baja DATETIME DEFAULT NULL,
    PRIMARY KEY (id_rol, id_permission),
    FOREIGN KEY (id_rol) REFERENCES cat_roles(id_rol),
    FOREIGN KEY (id_permission) REFERENCES cat_permissions(id_permission)
);

-- Usuarios ↔ Roles
CREATE TABLE users_roles (
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    is_primary TINYINT DEFAULT 0,
    fch_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    fch_baja DATETIME DEFAULT NULL,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES sy_usuarios(id_usuario),
    FOREIGN KEY (id_rol) REFERENCES cat_roles(id_rol)
);

-- Overrides
CREATE TABLE user_permission_overrides (
    id_usuario INT NOT NULL,
    id_permission INT NOT NULL,
    override_type ENUM('ALLOW', 'DENY') NOT NULL,
    fch_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    fch_baja DATETIME DEFAULT NULL,
    PRIMARY KEY (id_usuario, id_permission),
    FOREIGN KEY (id_usuario) REFERENCES sy_usuarios(id_usuario),
    FOREIGN KEY (id_permission) REFERENCES cat_permissions(id_permission)
);
```

### Datos Iniciales

```sql
-- Roles
INSERT INTO cat_roles (rol, desc_rol, landing_route, priority, is_admin, usr_alta) VALUES
('ADMINISTRADOR', 'Administradores del Sistema', '/admin', 1, 1, 'system'),
('MEDICOS', 'Médicos Especialistas', '/consultas', 2, 0, 'system'),
('RECEPCION', 'Personal de Recepción', '/recepcion', 3, 0, 'system');

-- Permisos
INSERT INTO cat_permissions (permission, category, display_name, description, usr_alta) VALUES
('expedientes:create', 'EXPEDIENTES', 'Crear expedientes', 'Crear nuevos expedientes', 'system'),
('expedientes:read', 'EXPEDIENTES', 'Ver expedientes', 'Consultar expedientes', 'system'),
('usuarios:create', 'USUARIOS', 'Crear usuarios', 'Registrar nuevos usuarios', 'system'),
('consultas:create', 'CONSULTAS', 'Crear consulta', 'Registrar consulta médica', 'system');

-- Asignar permisos a MEDICOS
INSERT INTO role_permissions (id_rol, id_permission) VALUES
(2, 2),  -- expedientes:read
(2, 4);  -- consultas:create
```

---

## Próximos Pasos

1. **Agregar overrides UI:** Página para asignar ALLOW/DENY a usuarios
2. **Logs de auditoría:** Registrar cambios de permisos
3. **Permisos granulares:** `expedientes:read:own` (solo sus propios expedientes)

---

**Última actualización:** Enero 2026
