# Plan de Implementación: CRUD Completo RBAC

> **Rama:** `feature/rbac-crud-management`  
> **Fecha Inicio:** 2026-01-05  
> **Objetivo:** Implementar gestión completa (CRUD) de Usuarios, Roles y Permisos en el sistema RBAC 2.0 de SIRES

---

## 📊 Estado Actual del Sistema

### ✅ Lo que YA funciona:

- Infraestructura RBAC 2.0 (decorators, AuthorizationService, cache)
- CRUD básico de usuarios (crear, listar, editar, activar/desactivar)
- Listar roles y permisos (solo lectura)
- Asignar/revocar permisos de roles (`role_permissions`)
- Hook `usePermissions()` y componente `<PermissionGate>` en frontend

### ❌ Lo que FALTA implementar:

**Backend:**
- [ ] CRUD completo de `cat_roles` (POST, PUT, DELETE)
- [ ] CRUD completo de `cat_permissions` (POST, PUT, DELETE)
- [ ] Gestión de múltiples roles por usuario (no solo rol primario)
- [ ] CRUD de `user_permissions` (overrides ALLOW/DENY por usuario)
- [ ] Permisos del sistema RBAC (`roles:create`, `permisos:create`, etc.)

**Frontend:**
- [ ] Conectar `UsersListPage` al backend real (quitar mock data)
- [ ] Conectar `RolesPage` al backend real
- [ ] Conectar `PermissionsPage` al backend real
- [ ] Formularios de creación/edición de roles
- [ ] Formularios de creación/edición de permisos
- [ ] UI para gestionar overrides de usuario

---

## 🗂️ Arquitectura de Archivos

### Backend

```
backend/src/
├── infrastructure/
│   ├── repositories/
│   │   ├── role_repository.py           # CREAR - CRUD roles
│   │   ├── permission_repository.py     # EXTENDER - CRUD permisos
│   │   └── user_repository.py           # EXTENDER - Multi-rol
│   └── authorization/
│       ├── authorization_service.py     # YA EXISTE - Verificar cache
│       └── decorators.py                # YA EXISTE - Usar en nuevos endpoints
├── use_cases/
│   ├── roles/                           # CREAR carpeta
│   │   ├── create_role.py
│   │   ├── update_role.py
│   │   └── delete_role.py
│   ├── permissions/                     # CREAR carpeta
│   │   ├── create_permission.py
│   │   ├── update_permission.py
│   │   ├── delete_permission.py
│   │   ├── add_user_override.py
│   │   └── remove_user_override.py
│   └── users/                           # EXTENDER si existe
│       ├── assign_role.py
│       ├── remove_role.py
│       └── set_primary_role.py
└── presentation/api/
    ├── roles_routes.py                  # CREAR - Blueprint roles
    ├── permissions_routes.py            # EXTENDER - Agregar CUD
    ├── users_routes.py                  # EXTENDER - Multi-rol + overrides
    └── __init__.py                      # MODIFICAR - Registrar roles_routes

migrations/
└── 006_rbac_management_permissions.sql  # CREAR - Permisos de gestión
```

### Frontend

```
frontend/src/
├── api/
│   ├── resources/
│   │   ├── roles.api.ts                 # CREAR
│   │   ├── permissions.api.ts           # EXTENDER
│   │   └── users.api.ts                 # EXTENDER
│   └── types/
│       ├── roles.types.ts               # CREAR
│       └── permissions.types.ts         # EXTENDER
├── features/admin/
│   ├── hooks/
│   │   ├── useRoles.ts                  # CREAR
│   │   ├── useAdminUsers.ts             # CREAR
│   │   └── useAdminPermissions.ts       # CREAR
│   └── components/
│       ├── UsersListPage.tsx            # REFACTOR - Quitar mock
│       ├── RolesPage.tsx                # REFACTOR - Quitar mock
│       └── PermissionsPage.tsx          # REFACTOR - Quitar mock
└── components/ui/
    └── [componentes shadcn si hacen falta]
```

---

## 🚀 Plan de Implementación por Fases

---

### **FASE 0: Migración - Permisos de Gestión RBAC**

**Objetivo:** Crear los permisos necesarios para gestionar el propio sistema RBAC.

**Archivos:**
- `backend/migrations/007_rbac_management_permissions.sql` - CREAR
  - **Nota:** Originalmente era 006, pero se renombró a 007 porque la migración 006 es `cleanup_mysql_otp.sql` (traída de `feature/integration-login`)

**Permisos a agregar:**

| Código | Recurso | Acción | Descripción | Categoría |
|--------|---------|--------|-------------|-----------|
| `roles:create` | roles | create | Crear roles | SISTEMA |
| `roles:read` | roles | read | Ver roles | SISTEMA |
| `roles:update` | roles | update | Modificar roles | SISTEMA |
| `roles:delete` | roles | delete | Eliminar roles | SISTEMA |
| `permisos:create` | permisos | create | Crear permisos | SISTEMA |
| `permisos:read` | permisos | read | Ver permisos | SISTEMA |
| `permisos:update` | permisos | update | Modificar permisos | SISTEMA |
| `permisos:delete` | permisos | delete | Eliminar permisos | SISTEMA |
| `permisos:assign` | permisos | assign | Asignar permisos a roles/usuarios | SISTEMA |

**Validación:**
```sql
SELECT code, description FROM cat_permissions WHERE category = 'SISTEMA' AND resource IN ('roles', 'permisos');
```

**Asignación inicial:** Todos estos permisos al rol `Admin` (id_rol = 1).

**Cambios adicionales:**
- Se agregó columna `is_system` a `cat_permissions` para marcar permisos protegidos
- Todos los permisos existentes se marcaron como `is_system = TRUE`
- Los nuevos permisos RBAC también son `is_system = TRUE`

**Estado:** [X] Completado (2026-01-05)

---

### **FASE 1: Backend - CRUD de Roles**

**Objetivo:** Implementar endpoints para crear, editar y eliminar roles.

#### Paso 1.1: Role Repository

**Archivo:** `backend/src/infrastructure/repositories/role_repository.py` - CREAR

**Métodos a implementar:**

```python
class RoleRepository:
    """Repository para gestión de cat_roles"""
    
    def __init__(self, db_session):
        self.db = db_session
    
    def create(self, nombre: str, descripcion: str = None, 
               landing_route: str = None, priority: int = 0, 
               is_admin: bool = False) -> tuple:
        """
        Crea un nuevo rol.
        Returns: (role_dict, error_code)
        """
        pass
    
    def update(self, role_id: int, **kwargs) -> tuple:
        """
        Actualiza un rol existente.
        Returns: (role_dict, error_code)
        """
        pass
    
    def delete(self, role_id: int) -> tuple:
        """
        Elimina un rol (verifica que no tenga usuarios asignados).
        Returns: (success, error_code)
        """
        pass
    
    def get_by_id(self, role_id: int) -> dict:
        """Obtiene rol por ID"""
        pass
    
    def get_all(self) -> list:
        """Lista todos los roles"""
        pass
    
    def count_users_with_role(self, role_id: int) -> int:
        """Cuenta usuarios con este rol asignado"""
        pass
```

**Validaciones:**
- Nombre único (no duplicar)
- Nombre no vacío, max 100 caracteres
- Priority >= 0
- No permitir eliminar roles del sistema (id 1-5)
- No permitir eliminar rol con usuarios asignados

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 1.2: Use Cases de Roles

**Archivos:** `backend/src/use_cases/roles/` - CREAR carpeta

##### `create_role.py`

```python
class CreateRoleUseCase:
    def __init__(self, role_repo: RoleRepository):
        self.role_repo = role_repo
    
    def execute(self, nombre: str, descripcion: str = None,
                landing_route: str = None, priority: int = 0,
                is_admin: bool = False) -> tuple:
        """
        Crea un nuevo rol.
        Returns: (role_dict, error_code)
        
        Errors:
        - ROLE_NAME_REQUIRED
        - ROLE_NAME_DUPLICATE
        - INVALID_PRIORITY
        - DATABASE_ERROR
        """
        pass
```

##### `update_role.py`

```python
class UpdateRoleUseCase:
    def __init__(self, role_repo: RoleRepository):
        self.role_repo = role_repo
    
    def execute(self, role_id: int, **kwargs) -> tuple:
        """
        Actualiza un rol existente.
        Returns: (role_dict, error_code)
        
        Errors:
        - ROLE_NOT_FOUND
        - ROLE_SYSTEM_PROTECTED (no editar Admin, Médico, etc.)
        - ROLE_NAME_DUPLICATE
        - DATABASE_ERROR
        """
        pass
```

##### `delete_role.py`

```python
class DeleteRoleUseCase:
    def __init__(self, role_repo: RoleRepository):
        self.role_repo = role_repo
    
    def execute(self, role_id: int) -> tuple:
        """
        Elimina un rol.
        Returns: (success, error_code)
        
        Errors:
        - ROLE_NOT_FOUND
        - ROLE_SYSTEM_PROTECTED
        - ROLE_HAS_USERS
        - DATABASE_ERROR
        """
        pass
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 1.3: Endpoints de Roles

**Archivo:** `backend/src/presentation/api/roles_routes.py` - CREAR

**Blueprint:** `roles_bp`

| Endpoint | Método | Permiso | Use Case | Status HTTP |
|----------|--------|---------|----------|-------------|
| `/api/v1/roles` | POST | `roles:create` | CreateRoleUseCase | 201 Created |
| `/api/v1/roles/<id>` | PUT | `roles:update` | UpdateRoleUseCase | 200 OK |
| `/api/v1/roles/<id>` | DELETE | `roles:delete` | DeleteRoleUseCase | 204 No Content |
| `/api/v1/roles` | GET | `roles:read` | (ya existe en permissions_routes?) | 200 OK |
| `/api/v1/roles/<id>` | GET | `roles:read` | RoleRepository.get_by_id | 200 OK |

**Ejemplo de endpoint:**

```python
@roles_bp.route('', methods=['POST'])
@jwt_required()
@requires_permission('roles:create')
def create_role():
    """
    POST /api/v1/roles
    Body: { nombre, descripcion?, landing_route?, priority?, is_admin? }
    """
    data = request.get_json()
    
    # Validar input
    nombre = data.get('nombre')
    if not nombre:
        return jsonify({'error': 'ROLE_NAME_REQUIRED'}), 400
    
    # Ejecutar use case
    use_case = CreateRoleUseCase(role_repo)
    role, error = use_case.execute(
        nombre=nombre,
        descripcion=data.get('descripcion'),
        landing_route=data.get('landing_route'),
        priority=data.get('priority', 0),
        is_admin=data.get('is_admin', False)
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify(role), 201
```

**Registrar blueprint:**

Modificar `backend/src/presentation/api/__init__.py`:

```python
from .roles_routes import roles_bp

def register_blueprints(app):
    # ... blueprints existentes
    app.register_blueprint(roles_bp, url_prefix='/api/v1/roles')
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 1.4: Verificación Fase 1

**Tests manuales con cURL/Postman:**

```bash
# 1. Crear rol
POST /api/v1/roles
{
  "nombre": "Enfermera",
  "descripcion": "Personal de enfermería",
  "landing_route": "/dashboard/nursing",
  "priority": 3
}

# 2. Actualizar rol
PUT /api/v1/roles/6
{
  "descripcion": "Personal de enfermería actualizado"
}

# 3. Intentar eliminar rol con usuarios (debe fallar)
DELETE /api/v1/roles/2

# 4. Eliminar rol sin usuarios
DELETE /api/v1/roles/6
```

**Checklist:**
- [ ] POST crea rol correctamente
- [ ] PUT actualiza rol existente
- [ ] DELETE rechaza rol con usuarios asignados
- [ ] DELETE rechaza roles de sistema (id 1-5)
- [ ] Endpoints requieren permisos (`roles:create`, etc.)
- [ ] Cache de AuthorizationService NO se rompe

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

### **FASE 2: Backend - CRUD de Permisos**

**Objetivo:** Implementar endpoints para crear, editar y eliminar permisos.

#### Paso 2.1: Extender Permission Repository

**Archivo:** `backend/src/infrastructure/repositories/permission_repository.py` - EXTENDER

**Métodos a agregar:**

```python
class PermissionRepository:
    # ... métodos existentes (get_all, get_by_id, etc.)
    
    def create(self, code: str, name: str, description: str = None,
               category: str = 'OTROS', resource: str = None,
               action: str = None) -> tuple:
        """
        Crea un nuevo permiso.
        code debe tener formato 'resource:action'
        is_system = False por defecto
        Returns: (permission_dict, error_code)
        """
        pass
    
    def update(self, permission_id: int, **kwargs) -> tuple:
        """
        Actualiza permiso existente.
        NO permite cambiar 'code' (inmutable)
        NO permite editar is_system = True
        Returns: (permission_dict, error_code)
        """
        pass
    
    def delete(self, permission_id: int) -> tuple:
        """
        Elimina permiso.
        Solo si is_system = False
        Elimina en cascada de role_permissions y user_permissions
        Returns: (success, error_code)
        """
        pass
    
    def get_categories(self) -> list:
        """
        Retorna lista de categorías únicas.
        Útil para filtros en UI.
        """
        pass
```

**Validaciones:**
- `code` único
- `code` formato `^[a-z_]+:[a-z_]+$` (regex)
- No permitir cambiar `code` en update
- No permitir editar/eliminar `is_system = True`

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 2.2: Use Cases de Permisos

**Archivos:** `backend/src/use_cases/permissions/` - CREAR carpeta

##### `create_permission.py`

```python
class CreatePermissionUseCase:
    def __init__(self, permission_repo: PermissionRepository):
        self.permission_repo = permission_repo
    
    def execute(self, code: str, name: str, description: str = None,
                category: str = 'OTROS') -> tuple:
        """
        Crea un nuevo permiso.
        Returns: (permission_dict, error_code)
        
        Errors:
        - PERMISSION_CODE_REQUIRED
        - PERMISSION_CODE_INVALID_FORMAT
        - PERMISSION_CODE_DUPLICATE
        - DATABASE_ERROR
        """
        # Validar formato de code (resource:action)
        import re
        if not re.match(r'^[a-z_]+:[a-z_]+$', code):
            return None, 'PERMISSION_CODE_INVALID_FORMAT'
        
        # Extraer resource y action del code
        resource, action = code.split(':')
        
        return self.permission_repo.create(
            code=code,
            name=name,
            description=description,
            category=category,
            resource=resource,
            action=action
        )
```

##### `update_permission.py`

```python
class UpdatePermissionUseCase:
    def __init__(self, permission_repo: PermissionRepository):
        self.permission_repo = permission_repo
    
    def execute(self, permission_id: int, **kwargs) -> tuple:
        """
        Actualiza permiso existente.
        Returns: (permission_dict, error_code)
        
        Errors:
        - PERMISSION_NOT_FOUND
        - PERMISSION_SYSTEM_PROTECTED
        - PERMISSION_CODE_IMMUTABLE (si intenta cambiar code)
        - DATABASE_ERROR
        """
        pass
```

##### `delete_permission.py`

```python
class DeletePermissionUseCase:
    def __init__(self, permission_repo: PermissionRepository):
        self.permission_repo = permission_repo
    
    def execute(self, permission_id: int) -> tuple:
        """
        Elimina permiso.
        Returns: (success, error_code)
        
        Errors:
        - PERMISSION_NOT_FOUND
        - PERMISSION_SYSTEM_PROTECTED
        - DATABASE_ERROR
        """
        pass
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 2.3: Endpoints de Permisos

**Archivo:** `backend/src/presentation/api/permissions_routes.py` - EXTENDER

**Agregar a blueprint existente:**

| Endpoint | Método | Permiso | Use Case | Status HTTP |
|----------|--------|---------|----------|-------------|
| `/api/v1/permissions` | POST | `permisos:create` | CreatePermissionUseCase | 201 Created |
| `/api/v1/permissions/<id>` | PUT | `permisos:update` | UpdatePermissionUseCase | 200 OK |
| `/api/v1/permissions/<id>` | DELETE | `permisos:delete` | DeletePermissionUseCase | 204 No Content |
| `/api/v1/permissions/categories` | GET | `permisos:read` | PermissionRepository.get_categories | 200 OK |

**Ejemplo:**

```python
@permissions_bp.route('', methods=['POST'])
@jwt_required()
@requires_permission('permisos:create')
def create_permission():
    """
    POST /api/v1/permissions
    Body: { code, name, description?, category? }
    """
    data = request.get_json()
    
    use_case = CreatePermissionUseCase(permission_repo)
    permission, error = use_case.execute(
        code=data.get('code'),
        name=data.get('name'),
        description=data.get('description'),
        category=data.get('category', 'OTROS')
    )
    
    if error:
        status = 400 if error != 'DATABASE_ERROR' else 500
        return jsonify({'error': error}), status
    
    return jsonify(permission), 201
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 2.4: Verificación Fase 2

**Tests manuales:**

```bash
# 1. Crear permiso
POST /api/v1/permissions
{
  "code": "test_module:execute",
  "name": "Ejecutar módulo de test",
  "description": "Permiso de prueba",
  "category": "TESTING"
}

# 2. Actualizar permiso
PUT /api/v1/permissions/100
{
  "description": "Descripción actualizada"
}

# 3. Intentar eliminar permiso de sistema (debe fallar)
DELETE /api/v1/permissions/1

# 4. Eliminar permiso custom
DELETE /api/v1/permissions/100

# 5. Listar categorías
GET /api/v1/permissions/categories
```

**Checklist:**
- [ ] POST crea permiso con formato `resource:action`
- [ ] PUT actualiza permiso (pero NO permite cambiar `code`)
- [ ] DELETE rechaza permisos con `is_system = True`
- [ ] DELETE elimina en cascada de `role_permissions` y `user_permissions`
- [ ] GET categories retorna lista única

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

### **FASE 3: Backend - Gestión Multi-Rol de Usuarios**

**Objetivo:** Permitir asignar múltiples roles a un usuario (no solo rol primario).

#### Paso 3.1: Extender User Repository

**Archivo:** `backend/src/infrastructure/repositories/user_repository.py` - EXTENDER

**Métodos a agregar:**

```python
class UserRepository:
    # ... métodos existentes
    
    def get_user_roles(self, user_id: int) -> list:
        """
        Retorna todos los roles del usuario.
        Returns: [{ id_rol, nombre, is_primary, created_at }, ...]
        """
        pass
    
    def assign_role(self, user_id: int, role_id: int, 
                    is_primary: bool = False) -> tuple:
        """
        Asigna rol adicional al usuario.
        Si is_primary=True, quita is_primary de otros roles.
        Returns: (success, error_code)
        """
        pass
    
    def remove_role(self, user_id: int, role_id: int) -> tuple:
        """
        Quita rol del usuario.
        No permite quitar el último rol.
        No permite quitar rol primario sin reasignar.
        Returns: (success, error_code)
        """
        pass
    
    def set_primary_role(self, user_id: int, role_id: int) -> tuple:
        """
        Cambia el rol primario del usuario.
        Returns: (success, error_code)
        """
        pass
```

**Validaciones:**
- Usuario debe existir
- Rol debe existir
- No duplicar asignación (user_id + role_id único)
- No quitar el último rol del usuario
- No quitar rol primario sin reasignar otro como primario

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 3.2: Use Cases de Multi-Rol

**Archivos:** `backend/src/use_cases/users/` - Crear si no existe

##### `assign_role.py`

```python
class AssignRoleUseCase:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    def execute(self, user_id: int, role_id: int, 
                is_primary: bool = False) -> tuple:
        """
        Asigna rol adicional a usuario.
        Returns: (success, error_code)
        
        Errors:
        - USER_NOT_FOUND
        - ROLE_NOT_FOUND
        - ROLE_ALREADY_ASSIGNED
        - DATABASE_ERROR
        """
        pass
```

##### `remove_role.py`

```python
class RemoveRoleUseCase:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    def execute(self, user_id: int, role_id: int) -> tuple:
        """
        Quita rol de usuario.
        Returns: (success, error_code)
        
        Errors:
        - USER_NOT_FOUND
        - ROLE_NOT_ASSIGNED
        - CANNOT_REMOVE_LAST_ROLE
        - CANNOT_REMOVE_PRIMARY_ROLE
        - DATABASE_ERROR
        """
        pass
```

##### `set_primary_role.py`

```python
class SetPrimaryRoleUseCase:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    def execute(self, user_id: int, role_id: int) -> tuple:
        """
        Cambia rol primario del usuario.
        Returns: (success, error_code)
        
        Errors:
        - USER_NOT_FOUND
        - ROLE_NOT_ASSIGNED
        - DATABASE_ERROR
        """
        pass
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 3.3: Endpoints de Multi-Rol

**Archivo:** `backend/src/presentation/api/users_routes.py` - EXTENDER

**Agregar endpoints:**

| Endpoint | Método | Permiso | Use Case | Status HTTP |
|----------|--------|---------|----------|-------------|
| `/api/v1/users/<id>/roles` | GET | `usuarios:read` | UserRepository.get_user_roles | 200 OK |
| `/api/v1/users/<id>/roles` | POST | `usuarios:assign_roles` | AssignRoleUseCase | 201 Created |
| `/api/v1/users/<id>/roles/<role_id>` | DELETE | `usuarios:assign_roles` | RemoveRoleUseCase | 204 No Content |
| `/api/v1/users/<id>/roles/<role_id>/primary` | PUT | `usuarios:update` | SetPrimaryRoleUseCase | 200 OK |

**Ejemplo:**

```python
@users_bp.route('/<int:user_id>/roles', methods=['GET'])
@jwt_required()
@requires_permission('usuarios:read')
def get_user_roles(user_id):
    """GET /api/v1/users/:id/roles"""
    roles = user_repo.get_user_roles(user_id)
    return jsonify({'roles': roles}), 200

@users_bp.route('/<int:user_id>/roles', methods=['POST'])
@jwt_required()
@requires_permission('usuarios:assign_roles')
def assign_role_to_user(user_id):
    """
    POST /api/v1/users/:id/roles
    Body: { role_id, is_primary? }
    """
    data = request.get_json()
    use_case = AssignRoleUseCase(user_repo)
    success, error = use_case.execute(
        user_id=user_id,
        role_id=data.get('role_id'),
        is_primary=data.get('is_primary', False)
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    # IMPORTANTE: Invalidar cache de permisos del usuario
    authorization_service.invalidate_user_cache(user_id)
    
    return jsonify({'success': True}), 201
```

**IMPORTANTE:** Al modificar roles de un usuario, **invalidar cache de AuthorizationService**:

```python
from infrastructure.authorization.authorization_service import authorization_service

# Después de assign/remove role
authorization_service.invalidate_user_cache(user_id)
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 3.4: Verificación Fase 3

**Tests manuales:**

```bash
# 1. Listar roles de usuario
GET /api/v1/users/10/roles

# 2. Asignar rol adicional
POST /api/v1/users/10/roles
{
  "role_id": 3,
  "is_primary": false
}

# 3. Cambiar rol primario
PUT /api/v1/users/10/roles/3/primary

# 4. Intentar quitar último rol (debe fallar)
DELETE /api/v1/users/10/roles/3

# 5. Quitar rol adicional
DELETE /api/v1/users/10/roles/4
```

**Checklist:**
- [ ] GET retorna todos los roles del usuario con `is_primary`
- [ ] POST asigna rol adicional sin perder los existentes
- [ ] PUT cambia rol primario correctamente
- [ ] DELETE rechaza quitar último rol
- [ ] DELETE rechaza quitar rol primario sin reasignar
- [ ] Cache de permisos se invalida al modificar roles

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

### **FASE 4: Backend - User Permission Overrides**

**Objetivo:** Permitir ALLOW/DENY específicos por usuario en `user_permissions`.

#### Paso 4.1: Extender Permission Repository

**Archivo:** `backend/src/infrastructure/repositories/permission_repository.py` - EXTENDER

**Métodos a agregar:**

```python
class PermissionRepository:
    # ... métodos existentes
    
    def get_user_effective_permissions(self, user_id: int) -> dict:
        """
        Retorna permisos efectivos del usuario.
        Returns: {
            'effective': [list de permission codes finales],
            'from_roles': [permisos de roles],
            'overrides': [{ permission, type, granted_by, reason, granted_at }]
        }
        """
        pass
    
    def add_user_override(self, user_id: int, permission_id: int,
                          override_type: str, granted_by: int,
                          reason: str = None) -> tuple:
        """
        Crea override ALLOW o DENY para usuario.
        override_type: 'ALLOW' | 'DENY'
        Returns: (override_dict, error_code)
        """
        pass
    
    def remove_user_override(self, user_id: int, permission_id: int) -> tuple:
        """
        Elimina override del usuario.
        Vuelve al comportamiento por defecto (lo que tenga por rol).
        Returns: (success, error_code)
        """
        pass
    
    def get_user_overrides(self, user_id: int) -> list:
        """
        Lista todos los overrides del usuario.
        Returns: [{ permission_id, code, type, granted_by, reason, granted_at }]
        """
        pass
```

**Validaciones:**
- `override_type` debe ser 'ALLOW' o 'DENY'
- No duplicar override del mismo permiso
- `granted_by` debe ser usuario válido

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 4.2: Use Cases de User Overrides

**Archivos:** `backend/src/use_cases/permissions/`

##### `add_user_override.py`

```python
class AddUserOverrideUseCase:
    def __init__(self, permission_repo: PermissionRepository):
        self.permission_repo = permission_repo
    
    def execute(self, user_id: int, permission_id: int,
                override_type: str, granted_by: int,
                reason: str = None) -> tuple:
        """
        Crea override ALLOW/DENY para usuario.
        Returns: (override_dict, error_code)
        
        Errors:
        - USER_NOT_FOUND
        - PERMISSION_NOT_FOUND
        - INVALID_OVERRIDE_TYPE
        - OVERRIDE_ALREADY_EXISTS
        - DATABASE_ERROR
        """
        if override_type not in ['ALLOW', 'DENY']:
            return None, 'INVALID_OVERRIDE_TYPE'
        
        return self.permission_repo.add_user_override(
            user_id=user_id,
            permission_id=permission_id,
            override_type=override_type,
            granted_by=granted_by,
            reason=reason
        )
```

##### `remove_user_override.py`

```python
class RemoveUserOverrideUseCase:
    def __init__(self, permission_repo: PermissionRepository):
        self.permission_repo = permission_repo
    
    def execute(self, user_id: int, permission_id: int) -> tuple:
        """
        Elimina override del usuario.
        Returns: (success, error_code)
        
        Errors:
        - OVERRIDE_NOT_FOUND
        - DATABASE_ERROR
        """
        pass
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 4.3: Endpoints de User Overrides

**Archivo:** `backend/src/presentation/api/users_routes.py` - EXTENDER

**Agregar endpoints:**

| Endpoint | Método | Permiso | Use Case | Status HTTP |
|----------|--------|---------|----------|-------------|
| `/api/v1/users/<id>/permissions` | GET | `usuarios:read` | PermissionRepository.get_user_effective_permissions | 200 OK |
| `/api/v1/users/<id>/permissions/override` | POST | `usuarios:assign_permissions` | AddUserOverrideUseCase | 201 Created |
| `/api/v1/users/<id>/permissions/override/<perm_id>` | DELETE | `usuarios:assign_permissions` | RemoveUserOverrideUseCase | 204 No Content |

**Ejemplo:**

```python
@users_bp.route('/<int:user_id>/permissions', methods=['GET'])
@jwt_required()
@requires_permission('usuarios:read')
def get_user_permissions(user_id):
    """
    GET /api/v1/users/:id/permissions
    Retorna permisos efectivos + overrides
    """
    permissions = permission_repo.get_user_effective_permissions(user_id)
    return jsonify(permissions), 200

@users_bp.route('/<int:user_id>/permissions/override', methods=['POST'])
@jwt_required()
@requires_permission('usuarios:assign_permissions')
def add_user_permission_override(user_id):
    """
    POST /api/v1/users/:id/permissions/override
    Body: { permission_id, override_type, reason? }
    """
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    use_case = AddUserOverrideUseCase(permission_repo)
    override, error = use_case.execute(
        user_id=user_id,
        permission_id=data.get('permission_id'),
        override_type=data.get('override_type'),
        granted_by=current_user_id,
        reason=data.get('reason')
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    # IMPORTANTE: Invalidar cache de permisos
    authorization_service.invalidate_user_cache(user_id)
    
    return jsonify(override), 201
```

**IMPORTANTE:** Verificar que `AuthorizationService.get_user_permissions()` aplique correctamente ALLOW/DENY de `user_permissions`.

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 4.4: Verificación Fase 4

**Tests manuales:**

```bash
# 1. Ver permisos efectivos del usuario
GET /api/v1/users/10/permissions

# 2. Agregar ALLOW (dar permiso que no tiene por rol)
POST /api/v1/users/10/permissions/override
{
  "permission_id": 50,
  "override_type": "ALLOW",
  "reason": "Acceso temporal para auditoría"
}

# 3. Agregar DENY (quitar permiso que SÍ tiene por rol)
POST /api/v1/users/10/permissions/override
{
  "permission_id": 10,
  "override_type": "DENY",
  "reason": "Restricción temporal"
}

# 4. Eliminar override
DELETE /api/v1/users/10/permissions/override/50

# 5. Verificar en permisos efectivos
GET /api/v1/users/10/permissions
```

**Checklist:**
- [ ] GET muestra permisos efectivos = (from_roles + ALLOW) - DENY
- [ ] POST ALLOW da permiso que no tenía por rol
- [ ] POST DENY quita permiso que sí tenía por rol
- [ ] DELETE vuelve al comportamiento por defecto
- [ ] Overrides registran `granted_by` y `reason`
- [ ] Cache se invalida al modificar overrides

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

### **FASE 5: Frontend - Conectar al Backend**

**Objetivo:** Quitar mock data de las páginas admin y conectar con los endpoints reales.

#### Paso 5.1: API Resources

**Archivos:**

##### `frontend/src/api/resources/roles.api.ts` - CREAR

```typescript
import { apiClient } from '../client';
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '../types/roles.types';

export const rolesApi = {
  // Listar roles
  getRoles: () => 
    apiClient.get<Role[]>('/roles'),
  
  // Obtener rol por ID
  getRole: (id: number) => 
    apiClient.get<Role>(`/roles/${id}`),
  
  // Crear rol
  createRole: (data: CreateRoleRequest) => 
    apiClient.post<Role>('/roles', data),
  
  // Actualizar rol
  updateRole: (id: number, data: UpdateRoleRequest) => 
    apiClient.put<Role>(`/roles/${id}`, data),
  
  // Eliminar rol
  deleteRole: (id: number) => 
    apiClient.delete(`/roles/${id}`),
  
  // Obtener permisos del rol
  getRolePermissions: (id: number) => 
    apiClient.get(`/roles/${id}/permissions`),
  
  // Asignar permiso a rol
  assignPermission: (roleId: number, permissionId: number) => 
    apiClient.post(`/roles/${roleId}/permissions`, { permission_id: permissionId }),
  
  // Revocar permiso de rol
  revokePermission: (roleId: number, permissionId: number) => 
    apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`),
};
```

##### `frontend/src/api/types/roles.types.ts` - CREAR

```typescript
export interface Role {
  id_rol: number;
  nombre: string;
  descripcion?: string;
  landing_route?: string;
  priority: number;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateRoleRequest {
  nombre: string;
  descripcion?: string;
  landing_route?: string;
  priority?: number;
  is_admin?: boolean;
}

export interface UpdateRoleRequest {
  nombre?: string;
  descripcion?: string;
  landing_route?: string;
  priority?: number;
  is_admin?: boolean;
}
```

##### `frontend/src/api/resources/permissions.api.ts` - EXTENDER

```typescript
// Agregar funciones:

export const permissionsApi = {
  // ... funciones existentes (getPermissions, etc.)
  
  // Crear permiso
  createPermission: (data: CreatePermissionRequest) => 
    apiClient.post<Permission>('/permissions', data),
  
  // Actualizar permiso
  updatePermission: (id: number, data: UpdatePermissionRequest) => 
    apiClient.put<Permission>(`/permissions/${id}`, data),
  
  // Eliminar permiso
  deletePermission: (id: number) => 
    apiClient.delete(`/permissions/${id}`),
  
  // Listar categorías
  getCategories: () => 
    apiClient.get<string[]>('/permissions/categories'),
};
```

##### `frontend/src/api/resources/users.api.ts` - EXTENDER

```typescript
// Agregar funciones:

export const usersApi = {
  // ... funciones existentes
  
  // Roles del usuario
  getUserRoles: (userId: number) => 
    apiClient.get<UserRole[]>(`/users/${userId}/roles`),
  
  assignRole: (userId: number, roleId: number, isPrimary?: boolean) => 
    apiClient.post(`/users/${userId}/roles`, { role_id: roleId, is_primary: isPrimary }),
  
  removeRole: (userId: number, roleId: number) => 
    apiClient.delete(`/users/${userId}/roles/${roleId}`),
  
  setPrimaryRole: (userId: number, roleId: number) => 
    apiClient.put(`/users/${userId}/roles/${roleId}/primary`),
  
  // Permisos del usuario
  getUserPermissions: (userId: number) => 
    apiClient.get<UserPermissionsResponse>(`/users/${userId}/permissions`),
  
  addUserOverride: (userId: number, permissionId: number, overrideType: 'ALLOW' | 'DENY', reason?: string) => 
    apiClient.post(`/users/${userId}/permissions/override`, { 
      permission_id: permissionId, 
      override_type: overrideType, 
      reason 
    }),
  
  removeUserOverride: (userId: number, permissionId: number) => 
    apiClient.delete(`/users/${userId}/permissions/override/${permissionId}`),
};
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 5.2: React Query Hooks

**Archivos:**

##### `frontend/src/features/admin/hooks/useRoles.ts` - CREAR

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@api/resources/roles.api';
import type { CreateRoleRequest, UpdateRoleRequest } from '@api/types/roles.types';

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getRoles,
  });
};

export const useRole = (id: number) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => rolesApi.getRole(id),
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleRequest }) => 
      rolesApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};
```

##### `frontend/src/features/admin/hooks/useAdminUsers.ts` - CREAR

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@api/resources/users.api';

export const useUserRoles = (userId: number) => {
  return useQuery({
    queryKey: ['users', userId, 'roles'],
    queryFn: () => usersApi.getUserRoles(userId),
    enabled: !!userId,
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId, isPrimary }: { userId: number; roleId: number; isPrimary?: boolean }) => 
      usersApi.assignRole(userId, roleId, isPrimary),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId, 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId, 'permissions'] });
    },
  });
};

// ... hooks similares para removeRole, setPrimaryRole, addUserOverride, etc.
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 5.3: Refactorizar Componentes

**Archivos a modificar:**

##### `frontend/src/features/admin/components/RolesPage.tsx`

**Cambios:**
- Quitar `mockRoles` del estado local
- Usar `useRoles()` hook para obtener datos
- Usar `useCreateRole()`, `useUpdateRole()`, `useDeleteRole()` para mutaciones
- Manejar loading states (`isLoading`, `isPending`)
- Manejar errores (`error`)

```typescript
import { useRoles, useCreateRole, useDeleteRole } from '../hooks/useRoles';

export function RolesPage() {
  const { data: roles, isLoading, error } = useRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  
  const handleCreate = async (data: CreateRoleRequest) => {
    try {
      await createRole.mutateAsync(data);
      // Cerrar modal, mostrar success toast
    } catch (err) {
      // Mostrar error toast
    }
  };
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    // ... render tabla con roles reales
  );
}
```

##### `frontend/src/features/admin/components/PermissionsPage.tsx`

Similar a RolesPage:
- Usar `usePermissions()` de permissions.api
- Agregar hooks de mutación

##### `frontend/src/features/admin/components/UsersListPage.tsx`

- Usar `useUsers()` (si existe) o crear
- Agregar modales para gestionar roles/permisos del usuario
- Usar `useUserRoles()`, `useAssignRole()`, etc.

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 5.4: Formularios con Validación Zod

**Ejemplo: CreateRoleForm.tsx**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createRoleSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  descripcion: z.string().optional(),
  landing_route: z.string().optional(),
  priority: z.number().min(0).default(0),
  is_admin: z.boolean().default(false),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export function CreateRoleForm({ onSubmit }: { onSubmit: (data: CreateRoleFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Nombre"
        error={errors.nombre?.message}
        {...register('nombre')}
      />
      
      <FormField
        label="Descripción"
        error={errors.descripcion?.message}
        {...register('descripcion')}
      />
      
      {/* ... más campos */}
      
      <Button type="submit">Crear Rol</Button>
    </form>
  );
}
```

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

#### Paso 5.5: Verificación Fase 5

**Checklist:**
- [ ] `RolesPage` muestra roles reales (no mock)
- [ ] Crear rol funciona y actualiza lista
- [ ] Editar rol funciona
- [ ] Eliminar rol funciona (con confirmación)
- [ ] `PermissionsPage` muestra permisos reales
- [ ] `UsersListPage` muestra usuarios reales
- [ ] Formularios validan con Zod
- [ ] Errores se muestran al usuario (toast/alert)
- [ ] Loading states se muestran durante fetch

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

### **FASE 6: Testing y Documentación**

**Objetivo:** Asegurar calidad y mantener documentación actualizada.

#### Paso 6.1: Testing Backend (Opcional)

**Archivos:** `backend/tests/` - Si se implementan tests

- Tests de use cases (unitarios)
- Tests de endpoints (integración con pytest)
- Tests de autorización (verificar decoradores)

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado | [X] Omitido

---

#### Paso 6.2: Testing Frontend (Opcional)

**Archivos:** `frontend/src/features/admin/__tests__/`

- Tests de hooks (con MSW para mock de API)
- Tests de componentes (Testing Library)

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado | [X] Omitido

---

#### Paso 6.3: Actualizar Documentación

**Archivos a actualizar:**

##### `docs/api/endpoints.md`

Agregar secciones:

```markdown
## Gestión de Roles

### POST /api/v1/roles
**Permiso:** `roles:create`
**Body:**
```json
{
  "nombre": "string",
  "descripcion": "string?",
  "landing_route": "string?",
  "priority": "number?",
  "is_admin": "boolean?"
}
```
**Response:** 201 Created
```json
{
  "id_rol": 6,
  "nombre": "Enfermera",
  "descripcion": "Personal de enfermería",
  ...
}
```

// ... documentar todos los endpoints nuevos
```

##### `docs/architecture/rbac.md`

- Actualizar diagramas si es necesario
- Documentar flujo de user overrides
- Documentar multi-rol

**Estado:** [ ] Pendiente | [ ] En Progreso | [ ] Completado

---

## 📊 Checklist Final

Antes de considerar la feature **COMPLETADA**:

### Backend
- [ ] Migración 006 ejecutada correctamente
- [ ] CRUD de roles funciona (create, update, delete)
- [ ] CRUD de permisos funciona
- [ ] Multi-rol de usuarios funciona
- [ ] User overrides (ALLOW/DENY) funciona
- [ ] Todos los endpoints requieren permisos correctos
- [ ] Cache de AuthorizationService se invalida correctamente
- [ ] Sin regresiones en funcionalidad existente

### Frontend
- [ ] Páginas admin conectadas al backend (sin mock data)
- [ ] Formularios con validación Zod funcionan
- [ ] Errores se muestran al usuario
- [ ] Loading states funcionan
- [ ] Invalidación de queries funciona correctamente

### Documentación
- [ ] `docs/api/endpoints.md` actualizado
- [ ] `docs/architecture/rbac.md` actualizado (si aplica)
- [ ] Este archivo (`rbac-crud-implementation.md`) marcado como completado

### Testing
- [ ] Tests manuales de todos los endpoints realizados
- [ ] Tests automatizados (opcional, si se implementan)

---

## 🔄 Historial de Cambios

| Fecha | Fase | Estado | Notas |
|-------|------|--------|-------|
| 2026-01-05 | Documento creado | ✅ | Plan inicial creado |
| 2026-01-05 | Fase 0 | ✅ Completado | Migración 006 creada con permisos RBAC + columna is_system |
| | Fase 1 | [ ] Pendiente | CRUD Roles |
| | Fase 2 | [ ] Pendiente | CRUD Permisos |
| | Fase 3 | [ ] Pendiente | Multi-rol |
| | Fase 4 | [ ] Pendiente | User overrides |
| | Fase 5 | [ ] Pendiente | Frontend |
| | Fase 6 | [ ] Pendiente | Testing/Docs |

---

## 📝 Notas del Implementador

### Fase 0 - Migración de Permisos (2026-01-05)

**Decisión:** Se agregó columna `is_system` a `cat_permissions`.

**Razón:** 
- Necesitamos proteger permisos del sistema de edición/eliminación accidental
- Los permisos de gestión RBAC (`roles:*`, `permisos:*`) son críticos
- Todos los permisos existentes se marcaron como `is_system = TRUE`

**Cambios en migración 007:**
1. ALTER TABLE para agregar `is_system BOOLEAN DEFAULT FALSE`
2. UPDATE para marcar permisos existentes como `is_system = TRUE`
3. INSERT de 9 permisos nuevos con `is_system = TRUE`
4. Asignación automática al rol Admin (id_rol = 1)

**Nota sobre numeración:** 
- Originalmente era migración 006, pero se renombró a 007
- La migración 006 es `cleanup_mysql_otp.sql` (traída del merge con `feature/integration-login`)
- Orden correcto: 001-005 (RBAC base) → 006 (OTP cleanup) → 007 (RBAC management)

**Validación requerida al ejecutar:**
```sql
-- Debe retornar 9
SELECT COUNT(*) FROM cat_permissions WHERE resource IN ('roles', 'permisos');

-- Debe retornar 9
SELECT COUNT(*) FROM role_permissions rp
INNER JOIN cat_permissions p ON rp.id_permission = p.id_permission
WHERE rp.id_rol = 1 AND p.resource IN ('roles', 'permisos');
```

---

**Fin del documento de plan de implementación.**
