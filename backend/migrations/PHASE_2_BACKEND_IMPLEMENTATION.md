# RBAC 2.0 - Phase 2: Backend Implementation

### 1. Permission Repository (`permission_repository.py`) ✅

**Ubicación:** `backend/src/infrastructure/repositories/permission_repository.py`

**Responsabilidades:**

- Acceso a datos de permisos (queries)
- Resolución de permisos efectivos con lógica DENY > ALLOW
- Gestión de roles y overrides de usuario
- CRUD de asignaciones permiso-rol

**Métodos principales:**

- `get_user_effective_permissions(user_id)` - Calcula permisos finales aplicando overrides
- `has_permission(user_id, permission)` - Verifica si tiene un permiso específico
- `get_landing_route(user_id)` - Obtiene ruta de redirección post-login
- `get_all_permissions()` - Catálogo completo de permisos
- `assign_permission_to_role(role_id, permission_id, user_id)` - Asigna permiso a rol
- `revoke_permission_from_role(role_id, permission_id, user_id)` - Revoca permiso

**Lógica de resolución:**

```
Permisos finales = (permisos_de_roles + user_ALLOW) - user_DENY

Prioridad:
1. is_admin = 1 → bypass total (wildcard "*")
2. user DENY → bloquea aunque el rol lo tenga
3. user ALLOW → concede aunque el rol no lo tenga
4. role permissions → permisos heredados de roles
5. default → DENY (modelo restrictivo)
```

---

### 2. Authorization Service (`authorization_service.py`) ✅

**Ubicación:** `backend/src/infrastructure/authorization/authorization_service.py`

**Responsabilidades:**

- Lógica de autorización (capa de servicio)
- Cache en memoria (TTL 5 minutos, configurable)
- Validación de formatos de permisos

**Métodos principales:**

- `get_user_permissions(user_id, use_cache=True)` - Obtiene permisos con cache
- `has_permission(user_id, permission)` - Valida permiso individual
- `has_any_permission(user_id, permissions)` - OR lógico de permisos
- `has_all_permissions(user_id, permissions)` - AND lógico de permisos
- `is_admin(user_id)` - Verifica si es administrador
- `invalidate_cache(user_id=None)` - Invalida cache (después de modificar permisos)
- `get_permission_summary(user_id)` - Resumen completo para debugging/UIs

**Cache:**

- TTL: 5 minutos por defecto
- En memoria simple: `{user_id: {permissions, cached_at, ...}}`
- Extensible a Redis (cambiar implementación en `__init__`)

---

### 3. Permission Decorators (`decorators.py`) ✅

**Ubicación:** `backend/src/infrastructure/authorization/decorators.py`

**Decorators implementados:**

#### `@requires_permission(permission)`

Verifica un permiso individual.

```python
@app.route("/api/v1/expedientes", methods=["POST"])
@jwt_required()
@requires_permission("expedientes:create")
def create_expediente():
    ...
```

#### `@requires_any_permission(permissions)`

Verifica que tenga AL MENOS UNO de los permisos listados (OR).

```python
@requires_any_permission(["reportes:view_all", "reportes:view_department"])
def get_report():
    ...
```

#### `@requires_all_permissions(permissions)`

Verifica que tenga TODOS los permisos listados (AND).

```python
@requires_all_permissions(["usuarios:create", "usuarios:assign_roles"])
def create_admin_user():
    ...
```

#### `@admin_required()`

Verifica que tenga `is_admin=1` (bypass total).

```python
@admin_required()
def delete_all_data():
    ...
```

**Orden de decorators:**

```python
@app.route(...)           # 1. Definir ruta
@jwt_required()           # 2. Validar autenticación (PRIMERO)
@requires_permission(...) # 3. Validar autorización (DESPUÉS)
def endpoint():
    ...
```

**Respuestas de error:**

- `401 UNAUTHORIZED` - Token inválido/ausente
- `403 FORBIDDEN` - No tiene el permiso requerido

---

### 4. Modificaciones en Use Cases ✅

#### `LoginUseCase` (login_usecase.py)

**Cambios:**

- Importa `authorization_service`
- Obtiene permisos efectivos del usuario con `get_user_permissions()`
- Incluye en `user_data`:
  - `permissions: []` - Lista de códigos de permisos
  - `landing_route: "/consultas"` - Ruta de redirección
  - `is_admin: false` - Flag de administrador

**Lógica:**

- Si `requires_onboarding=True` → permisos vacíos
- Si `requires_onboarding=False` → permisos completos desde BD

#### `CompleteOnboardingUseCase` (complete_onboarding_usecase.py)

**Cambios:**

- Importa `authorization_service`
- Después de completar onboarding, obtiene permisos y los incluye en respuesta
- Mismo formato de `user_data` que LoginUseCase

---

### 5. Modificaciones en Auth Routes (`auth_routes.py`) ✅

**Cambios en JWT claims:**

Todos los endpoints que generan tokens ahora incluyen `roles` en los claims:

#### `/login`

```python
additional_claims={
    "scope": "full_access",
    "username": username,
    "roles": roles  # 👈 NUEVO (lista de códigos de roles)
}
```

#### `/complete-onboarding`

```python
additional_claims={
    "scope": "full_access",
    "username": username,
    "roles": roles  # 👈 NUEVO
}
```

#### `/reset-password`

```python
additional_claims={
    "scope": "full_access" | "onboarding",
    "username": username,
    "roles": roles  # 👈 NUEVO (vacío si requiere onboarding)
}
```

**Formato de respuesta actualizado:**

Endpoints de autenticación ahora devuelven:

```json
{
  "user": {
    "id_usuario": 123,
    "usuario": "medico.general",
    "nombre_completo": "Juan Pérez López",
    "roles": ["MEDICOS"],
    "permissions": ["expedientes:read", "consultas:create", ...],
    "landing_route": "/consultas",
    "is_admin": false,
    "must_change_password": false
  },
  "requires_onboarding": false
}
```

---

### 6. Permissions Management Routes (`permissions_routes.py`) ✅

**Ubicación:** `backend/src/presentation/api/permissions_routes.py`

Blueprint de ejemplo que demuestra el uso del sistema RBAC 2.0.

#### Endpoints disponibles:

##### `GET /api/v1/permissions/me`

Obtiene permisos del usuario autenticado.

- **Auth:** JWT required
- **Permisos:** Ninguno (público para el usuario mismo)

##### `GET /api/v1/permissions/catalog`

Catálogo completo de permisos disponibles.

- **Auth:** JWT + Admin required

##### `GET /api/v1/permissions/user/<user_id>`

Permisos de un usuario específico.

- **Auth:** JWT required
- **Permisos:** `usuarios:read`

##### `POST /api/v1/permissions/role/<role_id>/assign`

Asigna permiso a un rol.

- **Auth:** JWT + Admin required
- **Body:** `{ "permission_id": 15 }`
- **Efecto:** Invalida cache de permisos

##### `POST /api/v1/permissions/role/<role_id>/revoke`

Revoca permiso de un rol.

- **Auth:** JWT + Admin required
- **Body:** `{ "permission_id": 15 }`
- **Efecto:** Invalida cache de permisos

##### `POST /api/v1/permissions/cache/invalidate`

Invalida cache de permisos.

- **Auth:** JWT + Admin required
- **Body (opcional):** `{ "user_id": 123 }`
- **Efecto:** Limpia cache (solo user_id o completo)

---

### 7. Registro de Blueprint en `create_app()` ✅

**Ubicación:** `backend/src/__init__.py`

Agregado:

```python
from src.presentation.api.permissions_routes import permissions_bp
app.register_blueprint(permissions_bp, url_prefix="/api/v1/permissions")
```

---

## Cómo usar el sistema (Guía de implementación)

### Paso 1: Proteger un endpoint con permisos

```python
# backend/src/presentation/api/expedientes_routes.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from src.infrastructure.authorization.decorators import requires_permission

expedientes_bp = Blueprint("expedientes", __name__)

@expedientes_bp.route("/", methods=["POST"])
@jwt_required()  # 1. Verificar autenticación
@requires_permission("expedientes:create")  # 2. Verificar permiso
def create_expediente():
    # Si llegó acá, el usuario tiene el permiso
    return jsonify({"message": "Expediente creado"}), 201
```

### Paso 2: Usar permisos en lógica de negocio (opcional)

```python
# backend/src/use_cases/expedientes/list_expedientes_usecase.py
from src.infrastructure.authorization.authorization_service import authorization_service

class ListExpedientesUseCase:
    def execute(self, user_id: int, filters: dict):
        # Verificar si puede ver todos o solo los propios
        can_view_all = authorization_service.has_permission(user_id, "expedientes:read_all")

        if can_view_all:
            # Retornar todos
            pass
        else:
            # Retornar solo los propios
            filters["created_by"] = user_id
```

### Paso 3: Frontend consume los datos

El frontend recibe en login/onboarding:

```typescript
// frontend/src/api/types/auth.types.ts
export interface Usuario {
  id_usuario: number;
  usuario: string;
  nombre_completo: string;
  roles: string[]; // 👈 NUEVO
  permissions: string[]; // 👈 NUEVO
  landing_route: string; // 👈 NUEVO
  is_admin: boolean; // 👈 NUEVO
  must_change_password: boolean;
}
```

---

## Testing Manual (Checklist)

### ✅ Paso 1: Ejecutar migraciones de BD

```bash
cd backend/migrations
mysql -u sires -p SIRES < 001_rbac_foundation.sql
mysql -u sires -p SIRES < 002_rbac_alter_existing_tables.sql
mysql -u sires -p SIRES < 003_rbac_seed_permissions.sql
mysql -u sires -p SIRES < 004_rbac_assign_permissions.sql
mysql -u sires -p SIRES < 005_rbac_verification.sql
```

### ✅ Paso 2: Verificar migraciones

Revisar output de `005_rbac_verification.sql` - debe mostrar:

- Tablas creadas correctamente
- ~70-80 permisos insertados
- Permisos asignados a roles
- No errores de integridad referencial

### ✅ Paso 3: Iniciar backend

```bash
cd backend
python run.py
```

Verificar logs:

- No errores de imports
- Flask inicia en puerto 5000
- Blueprints registrados: `/api/v1/auth` y `/api/v1/permissions`

### ✅ Paso 4: Test de login (obtener permisos)

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario": "admin", "clave": "Admin123!"}' \
  -c cookies.txt
```

**Verificar respuesta:**

- ✅ `user.permissions` es un array no vacío
- ✅ `user.landing_route` está definido (no "/dashboard" genérico)
- ✅ `user.is_admin` es `true` (si es ADMINISTRADOR)
- ✅ `user.roles` contiene códigos de roles (ej: `["ADMINISTRADOR"]`)

### ✅ Paso 5: Test de endpoint protegido

```bash
curl -X GET http://localhost:5000/api/v1/permissions/me \
  -b cookies.txt
```

**Verificar respuesta:**

- ✅ Status 200
- ✅ Retorna permisos del usuario
- ✅ `cached: true` (después de la segunda llamada)

### ✅ Paso 6: Test de endpoint admin-only

```bash
curl -X GET http://localhost:5000/api/v1/permissions/catalog \
  -b cookies.txt
```

**Verificar:**

- ✅ Si es admin: status 200, retorna catálogo completo
- ✅ Si NO es admin: status 403 con mensaje `"Esta acción requiere privilegios de administrador"`

### ✅ Paso 7: Test de DENY override (manual en BD)

Insertar override en BD:

```sql
-- Denegar permiso de crear expedientes al usuario admin (aunque su rol lo tenga)
INSERT INTO user_permissions (id_usuario, id_permission, effect, usr_alta, fch_alta)
SELECT
  (SELECT id_usuario FROM sy_usuarios WHERE usuario = 'admin'),
  (SELECT id_permission FROM cat_permissions WHERE code = 'expedientes:create'),
  'DENY',
  1,
  NOW();
```

Llamar a `/permissions/me` nuevamente:

**Verificar:**

- ✅ `expedientes:create` NO aparece en la lista de permisos
- ✅ Cache se invalida correctamente al hacer POST a `/permissions/cache/invalidate`

---

## Troubleshooting

### Error: `ModuleNotFoundError: No module named 'src.infrastructure.authorization'`

**Causa:** Falta `__init__.py` en el módulo.

**Solución:**

```bash
touch backend/src/infrastructure/authorization/__init__.py
```

### Error: `Invalid token` en requests con decorators

**Causa:** Olvidaste poner `@jwt_required()` antes de `@requires_permission()`.

**Solución:** Orden correcto:

```python
@jwt_required()  # PRIMERO
@requires_permission("...")  # DESPUÉS
def endpoint():
```

### Error: `403 FORBIDDEN` cuando debería tener permiso

**Causas posibles:**

1. Migraciones no ejecutadas (permisos no asignados a roles)
2. Usuario no tiene rol asignado en `users_roles`
3. Cache desactualizado (invalidar con `/permissions/cache/invalidate`)
4. Override DENY activo en `user_permissions`

**Debug:**

```bash
curl -X GET http://localhost:5000/api/v1/permissions/me -b cookies.txt
```

Revisar qué permisos tiene realmente el usuario.

### Permisos vacíos en respuesta de login

**Causa:** Usuario no tiene roles asignados en `users_roles` o roles no tienen permisos en `role_permissions`.

**Solución:** Ejecutar `004_rbac_assign_permissions.sql` y verificar con:

```sql
-- Verificar asignación de permisos al rol MEDICOS (id=1)
SELECT cp.code, cp.description
FROM role_permissions rp
INNER JOIN cat_permissions cp ON rp.id_permission = cp.id_permission
WHERE rp.id_rol = 1
  AND rp.fch_baja IS NULL;
```

---

## Próximos Pasos: Phase 3 (Frontend)

### Tareas pendientes:

1. **Actualizar types** (`frontend/src/api/types/auth.types.ts`)

   - Agregar `permissions`, `landing_route`, `is_admin` a `Usuario`

2. **Crear hook `usePermissions`** (`frontend/src/features/auth/hooks/usePermissions.ts`)

   ```typescript
   export const usePermissions = () => {
     const user = useAuthStore((state) => state.user);

     const hasPermission = (permission: string): boolean => {
       if (user?.is_admin) return true;
       return user?.permissions?.includes(permission) ?? false;
     };

     return { hasPermission, permissions: user?.permissions ?? [] };
   };
   ```

3. **Crear componente `<PermissionGate>`** (`frontend/src/components/shared/PermissionGate.tsx`)

   ```tsx
   export const PermissionGate = ({
     permission,
     children,
     fallback = null,
   }) => {
     const { hasPermission } = usePermissions();
     return hasPermission(permission) ? children : fallback;
   };
   ```

4. **Modificar `<ProtectedRoute>`** para soportar `requiredPermission`

5. **Implementar redirección post-login** con `landing_route`

6. **Testing E2E** con diferentes roles y permisos

---
