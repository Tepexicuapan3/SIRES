# USUARIOS_CRUD_IMPLEMENTATION.md

Sistema de Gestión de Usuarios - SIRES (Metro CDMX)  
**Clean Architecture + RBAC 2.0**

---

## 📋 Resumen Ejecutivo

Este documento describe la implementación completa del CRUD de usuarios para SIRES, siguiendo principios de Clean Architecture y patrones de diseño enterprise.

**Fases completadas:**
- ✅ Phase 1: READ Operations (List + Get)
- ✅ Phase 2: UPDATE Operations (Profile data)
- ✅ Phase 3a: Change User Role
- ✅ Phase 3b: Deactivate/Activate User

**Stack técnico:**
- Backend: Python 3.12 + Flask
- Base de datos: MySQL (host: 10.15.15.76)
- Autenticación: JWT en cookies HttpOnly + CSRF token
- Autorización: RBAC 2.0 basado en permisos

---

## 🏗️ Arquitectura y Patrones Aplicados

### Clean Architecture (3 capas)

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (src/presentation/api)              │
│  - Flask Blueprints                                     │
│  - Parsing de requests                                  │
│  - Mapping de errores → HTTP status codes              │
│  - NO contiene lógica de negocio                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  APPLICATION LAYER (src/use_cases)                      │
│  - Casos de uso (business logic)                        │
│  - Validaciones de reglas de negocio                    │
│  - Orquestación de repositories                         │
│  - Retorna: (result, error_code)                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (src/infrastructure/repositories) │
│  - Acceso a base de datos                               │
│  - Queries SQL parametrizadas                           │
│  - NO contiene reglas de negocio                        │
└─────────────────────────────────────────────────────────┘
```

**Beneficios:**
- ✅ Testeable (cada capa se puede testear aislada)
- ✅ Mantenible (cambios localizados)
- ✅ Escalable (agregar features no rompe existentes)
- ✅ Independencia de frameworks (Flask es un detalle de implementación)

### Patrones de Diseño Implementados

#### 1. Repository Pattern
**Responsabilidad:** Abstraer acceso a datos.

```python
# ❌ ANTES (lógica dispersa)
def get_user():
    conn = mysql.connect(...)
    cursor.execute("SELECT * FROM sy_usuarios WHERE ...")
    # mezcla de SQL + validaciones + HTTP

# ✅ DESPUÉS (Repository)
class UserRepository:
    def get_user_by_id(self, user_id: int) -> dict | None:
        # Solo SQL, retorna datos crudos
```

**Por qué importa:** Cambiar de MySQL a PostgreSQL solo toca el repository, no los use cases ni routes.

#### 2. Use Case Pattern (Application Service)
**Responsabilidad:** Orquestar lógica de negocio.

```python
class UpdateUserUseCase:
    def execute(self, user_id, data, modified_by):
        # 1. Validar que usuario existe
        # 2. Validar formato de email
        # 3. Verificar unicidad de email
        # 4. Ejecutar update
        # 5. Retornar (result, error_code)
```

**Por qué importa:** La lógica de negocio está en UN solo lugar, no repetida en múltiples endpoints.

#### 3. Error Handling Consistente
**Responsabilidad:** Códigos de error estables para el frontend.

```python
# Use Case retorna código estable
return None, "EMAIL_DUPLICATE"

# Route mapea a HTTP
error_mapping = {
    "EMAIL_DUPLICATE": (409, "El correo ya está en uso"),
    ...
}
```

**Por qué importa:** El frontend puede manejar errores de forma predecible sin parsear strings.

---

## 📂 Estructura de Archivos

```
backend/src/
├── infrastructure/repositories/
│   └── user_repository.py              # 14 métodos (CRUD + queries)
│
├── use_cases/users/
│   ├── list_users_usecase.py           # GET /users
│   ├── get_user_usecase.py             # GET /users/<id>
│   ├── create_user_usecase.py          # POST /users (ya existía)
│   ├── update_user_usecase.py          # PATCH /users/<id>
│   ├── change_role_usecase.py          # PATCH /users/<id>/role
│   └── toggle_user_status_usecase.py   # PATCH /users/<id>/activate|deactivate
│
└── presentation/api/
    └── users_routes.py                 # 8 endpoints (Flask Blueprint)
```

**Tests:**
```
backend/
├── test_manual.py                      # Tests Phase 1 (READ)
├── test_update_users.py                # Tests Phase 2 (UPDATE)
└── test_update_users_noemoji.py        # Versión sin emojis (Windows)
```

---

## 🔍 Phase 1: READ Operations

### Endpoints Implementados

#### `GET /api/v1/users`
Lista usuarios con paginación y filtros.

**Query params:**
- `page` (int, default=1): Número de página
- `page_size` (int, default=20, max=200): Registros por página
- `search` (string, opcional): Búsqueda en usuario/nombre/expediente/CURP/correo
- `estado` (string, opcional): 'A' (activo) o 'B' (baja)
- `rol_id` (int, opcional): Filtrar por rol específico

**Response 200:**
```json
{
  "items": [
    {
      "id_usuario": 14,
      "usuario": "testmedico",
      "nombre": "Doctor",
      "paterno": "Pérez",
      "materno": "García",
      "expediente": "88888888",
      "curp": "YYYY000000YYYYYYY00",
      "correo": "medico@test.local",
      "est_usuario": "A",
      "rol_primario": "MEDICOS",
      "usr_alta": "system",
      "fch_alta": "2025-12-29T16:23:59",
      "usr_modf": null,
      "fch_modf": null
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 12,
  "total_pages": 1
}
```

**Seguridad:**
- ✅ Requiere JWT válido
- ✅ Requiere permiso `usuarios:read`
- ✅ NO retorna password (`clave` nunca se expone)

**Ejemplo de uso:**
```bash
curl -X GET "http://localhost:5000/api/v1/users?page=1&search=medico&estado=A" \
  -H "Cookie: access_token_cookie=..." \
  -H "X-CSRF-TOKEN: ..."
```

---

#### `GET /api/v1/users/<id>`
Obtiene detalles completos de un usuario.

**Response 200:**
```json
{
  "user": {
    "id_usuario": 14,
    "usuario": "testmedico",
    "nombre": "Doctor",
    "paterno": "Pérez",
    "materno": "García",
    "expediente": "88888888",
    "curp": "YYYY000000YYYYYYY00",
    "correo": "medico@test.local",
    "img_perfil": "default.png",
    "est_usuario": "A",
    "usr_alta": "system",
    "fch_alta": "2025-12-29T16:23:59",
    "usr_modf": 13,
    "fch_modf": "2025-12-30T16:15:22",
    "terminos_acept": "S",
    "cambiar_clave": "N",
    "last_conexion": "2025-12-29T16:24:05",
    "ip_ultima": "172.18.0.1"
  },
  "roles": [
    {
      "id_rol": 1,
      "rol": "MEDICOS",
      "desc_rol": "CONSULTA DE MEDICOS",
      "is_primary": 1
    }
  ]
}
```

**Errors:**
- `404 USER_NOT_FOUND`: Usuario no existe

---

### Repository Methods (Phase 1)

```python
class UserRepository:
    def count_users(self, filters: dict) -> int
        """Cuenta usuarios que cumplen filtros (para paginación)"""
    
    def list_users(self, page: int, page_size: int, filters: dict) -> list[dict]
        """Lista usuarios con paginación y filtros"""
    
    def get_user_by_id_with_audit(self, user_id: int) -> dict | None
        """Obtiene usuario con campos de auditoría (usr_alta, fch_alta, etc.)"""
    
    def get_user_roles_with_details(self, user_id: int) -> list[dict]
        """Obtiene roles completos del usuario con información detallada"""
```

**Decisiones técnicas:**
- ✅ Queries parametrizadas (`%s`) para prevenir SQL injection
- ✅ `DISTINCT` para evitar duplicados cuando hay JOINs
- ✅ Subquery para obtener `rol_primario` en listado
- ✅ `dictionary=True` en cursor para retornar dicts

---

## ✏️ Phase 2: UPDATE Operations

### Endpoint Implementado

#### `PATCH /api/v1/users/<id>`
Actualiza datos de perfil de un usuario.

**Campos actualizables:**
- `nombre` (string)
- `paterno` (string)
- `materno` (string)
- `correo` (string, validado)

**Campos NO actualizables:**
- `usuario` (inmutable)
- `expediente` (inmutable)
- `curp` (inmutable)
- `clave` (usar endpoint específico de cambio de contraseña)

**Request Body (todos opcionales, al menos uno requerido):**
```json
{
  "nombre": "Juan Carlos",
  "paterno": "López",
  "materno": "Martínez",
  "correo": "jclopez@metro.cdmx.gob.mx"
}
```

**Response 200:**
```json
{
  "message": "Usuario actualizado correctamente",
  "user": {
    "id_usuario": 14,
    "usuario": "testmedico",
    "nombre": "Juan Carlos",
    "paterno": "López",
    "materno": "Martínez",
    "correo": "jclopez@metro.cdmx.gob.mx",
    "usr_modf": 13,
    "fch_modf": "2025-12-30T16:15:45",
    ...
  }
}
```

**Errors:**
- `400 NO_FIELDS_TO_UPDATE`: No se enviaron campos para actualizar
- `404 USER_NOT_FOUND`: Usuario no existe
- `409 EMAIL_DUPLICATE`: El correo ya está en uso por otro usuario
- `422 INVALID_EMAIL`: Formato de correo inválido
- `500 UPDATE_FAILED`: Error al ejecutar la actualización

**Seguridad:**
- ✅ Requiere JWT + CSRF token
- ✅ Requiere permiso `usuarios:update`
- ✅ Whitelist de campos permitidos (no blacklist)
- ✅ Validación de formato de email (regex)
- ✅ Verificación de unicidad de email
- ✅ Audit trail automático (`usr_modf`, `fch_modf`)

---

### Repository Methods (Phase 2)

```python
class UserRepository:
    def email_exists_for_other_user(self, email: str, exclude_user_id: int) -> bool
        """Verifica si un email está en uso por OTRO usuario (para updates)"""
    
    def update_user(self, user_id: int, data: dict, modified_by: int) -> bool
        """
        Actualiza campos permitidos:
        - Construye query dinámicamente solo con campos enviados
        - Agrega usr_modf y fch_modf automáticamente
        - Retorna True si se actualizó al menos 1 fila
        """
```

**Código relevante (query dinámica):**
```python
# Campos permitidos (whitelist)
allowed_fields = ["nombre", "paterno", "materno", "correo"]

# Construir UPDATE dinámico
updates = []
params = []
for field in allowed_fields:
    if field in data:
        updates.append(f"{field} = %s")
        params.append(data[field])

# Agregar audit
updates.append("usr_modf = %s")
updates.append("fch_modf = NOW()")
params.append(modified_by)
params.append(user_id)

query = f"UPDATE sy_usuarios SET {', '.join(updates)} WHERE id_usuario = %s"
cursor.execute(query, tuple(params))
```

**Por qué importa:**
- ✅ Evita mass assignment attacks
- ✅ No ejecuta UPDATE si no hay cambios
- ✅ Audit trail automático (no se puede olvidar)

---

### Use Case Logic (Phase 2)

```python
class UpdateUserUseCase:
    def execute(self, user_id, data, modified_by):
        # 1. Verificar que usuario existe
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"
        
        # 2. Filtrar solo campos permitidos
        allowed = {"nombre", "paterno", "materno", "correo"}
        fields_to_update = {k: v for k, v in data.items() if k in allowed}
        
        if not fields_to_update:
            return None, "NO_FIELDS_TO_UPDATE"
        
        # 3. Si actualiza email, validar formato y unicidad
        if "correo" in fields_to_update:
            if not self._is_valid_email(fields_to_update["correo"]):
                return None, "INVALID_EMAIL"
            
            if self.user_repo.email_exists_for_other_user(
                fields_to_update["correo"], user_id
            ):
                return None, "EMAIL_DUPLICATE"
        
        # 4. Ejecutar update
        success = self.user_repo.update_user(user_id, fields_to_update, modified_by)
        if not success:
            return None, "UPDATE_FAILED"
        
        # 5. Retornar usuario actualizado
        return self.user_repo.get_user_by_id_with_audit(user_id), None
```

**Principios aplicados:**
- **Single Responsibility:** Use case solo orquesta, no ejecuta SQL
- **Dependency Inversion:** Use case depende de abstracción (repository), no de MySQL
- **Fail-fast:** Validaciones al inicio, update solo si todo OK

---

## 🔄 Phase 3a: Change User Role

### Endpoint Implementado

#### `PATCH /api/v1/users/<id>/role`
Cambia el rol primario de un usuario.

**Request Body:**
```json
{
  "id_rol": 3
}
```

**Response 200:**
```json
{
  "message": "Rol actualizado correctamente",
  "user": { ... },
  "roles": [
    {
      "id_rol": 3,
      "rol": "ESPECIALISTAS",
      "desc_rol": "CONSULTA DE MEDICOS ESPECIALISTAS",
      "is_primary": 1
    }
  ]
}
```

**Errors:**
- `400 INVALID_REQUEST`: Falta `id_rol` en el body
- `404 USER_NOT_FOUND`: Usuario no existe
- `404 ROLE_NOT_FOUND`: Rol no existe o está inactivo
- `409 SAME_ROLE`: El usuario ya tiene ese rol como primario
- `500 CHANGE_FAILED`: Error al ejecutar el cambio

**Seguridad:**
- ✅ Requiere JWT + CSRF token
- ✅ Solo administradores (`@admin_required()`)

---

### Repository Methods (Phase 3a)

```python
class UserRepository:
    def get_role_by_id(self, role_id: int) -> dict | None
        """Obtiene rol por ID (solo si está activo)"""
    
    def change_user_primary_role(self, user_id: int, new_role_id: int, modified_by: int) -> bool
        """
        Cambia rol primario:
        1. Desmarca rol primario actual (is_primary = 0)
        2. Si usuario ya tiene el nuevo rol, lo marca como primario
        3. Si no lo tiene, lo inserta con is_primary = 1
        """
```

**Lógica de cambio de rol:**
```sql
-- 1. Desmarcar rol primario actual
UPDATE users_roles 
SET is_primary = 0, usr_modf = ?, fch_modf = NOW()
WHERE id_usuario = ? AND is_primary = 1

-- 2. Verificar si ya tiene el nuevo rol
SELECT id_usr_roles, est_usr_rol
FROM users_roles
WHERE id_usuario = ? AND id_rol = ?

-- 3a. Si existe, marcarlo como primario
UPDATE users_roles
SET is_primary = 1, est_usr_rol = 'A', usr_modf = ?, fch_modf = NOW()
WHERE id_usr_roles = ?

-- 3b. Si no existe, insertarlo
INSERT INTO users_roles (id_usuario, id_rol, is_primary, tp_asignacion, est_usr_rol, usr_alta, fch_alta)
VALUES (?, ?, 1, 'ROL', 'A', ?, NOW())
```

**Campo importante:** `tp_asignacion = 'ROL'` (vs. 'PERS' para permisos personalizados).

---

## 🔓 Phase 3b: Deactivate/Activate User

### Endpoints Implementados

#### `PATCH /api/v1/users/<id>/deactivate`
Desactiva un usuario (soft delete).

**Response 200:**
```json
{
  "message": "Usuario desactivado correctamente",
  "user": {
    "id_usuario": 14,
    "usuario": "testmedico",
    "est_usuario": "B",
    "usr_modf": 13,
    "fch_modf": "2025-12-30T16:20:00",
    ...
  }
}
```

---

#### `PATCH /api/v1/users/<id>/activate`
Reactiva un usuario desactivado.

**Response 200:**
```json
{
  "message": "Usuario activado correctamente",
  "user": {
    "id_usuario": 14,
    "usuario": "testmedico",
    "est_usuario": "A",
    "usr_modf": 13,
    "fch_modf": "2025-12-30T16:21:00",
    ...
  }
}
```

**Errors:**
- `404 USER_NOT_FOUND`: Usuario no existe
- `500 TOGGLE_FAILED`: Error al ejecutar el cambio

**Seguridad:**
- ✅ Requiere JWT + CSRF token
- ✅ Solo administradores (`@admin_required()`)

---

### Repository Methods (Phase 3b)

```python
class UserRepository:
    def deactivate_user(self, user_id: int, modified_by: int) -> bool
        """Marca est_usuario = 'B' (baja)"""
    
    def activate_user(self, user_id: int, modified_by: int) -> bool
        """Marca est_usuario = 'A' (activo)"""
```

**Implementación simple:**
```sql
UPDATE sy_usuarios
SET est_usuario = 'B', usr_modf = ?, fch_modf = NOW()
WHERE id_usuario = ?
```

**Nota:** Esto es **soft delete** (no borra físicamente). El registro sigue en la BD pero está marcado como inactivo.

---

## 🛡️ Seguridad y Audit Trail

### Autenticación y Autorización

Todos los endpoints requieren:
1. **JWT en cookie HttpOnly** (`access_token_cookie`)
2. **CSRF token** en header `X-CSRF-TOKEN` (para métodos mutantes: POST/PATCH/DELETE)
3. **Permisos RBAC:**
   - `usuarios:read` → Listar y ver usuarios
   - `usuarios:update` → Actualizar perfiles
   - `ADMINISTRADOR` → Cambiar roles, activar/desactivar

### Audit Trail Automático

Cada operación actualiza:
- **Creación:**
  - `usr_alta` → ID del usuario que creó el registro
  - `fch_alta` → Timestamp de creación

- **Modificación:**
  - `usr_modf` → ID del usuario que modificó
  - `fch_modf` → Timestamp de modificación

**Implementación en repository:**
```python
cursor.execute("""
    UPDATE sy_usuarios
    SET nombre = %s, usr_modf = %s, fch_modf = NOW()
    WHERE id_usuario = %s
""", (new_name, modified_by, user_id))
```

**Por qué importa:**
- ✅ Cumplimiento regulatorio (HIPAA, normativa médica)
- ✅ Trazabilidad de cambios
- ✅ Investigación de incidentes

### Validaciones de Seguridad

1. **SQL Injection:** Queries parametrizadas (`%s`)
2. **Mass Assignment:** Whitelist de campos permitidos
3. **XSS:** Tokens en cookies HttpOnly
4. **CSRF:** Double-submit cookie pattern
5. **Rate Limiting:** (propuesto en docs, no implementado aún)

---

## 📊 Testing

### Tests Manuales Ejecutados

**Phase 1 - READ:**
```bash
python backend/test_manual.py
```
- ✅ List users con paginación
- ✅ List users con filtros (search, estado, rol_id)
- ✅ Get user by ID
- ✅ Passwords nunca expuestos
- ✅ 404 para usuarios inexistentes

**Phase 2 - UPDATE:**
```bash
python backend/test_update_users_noemoji.py
```
- ✅ Update nombre, paterno, materno
- ✅ Update solo email
- ✅ Update todos los campos
- ✅ Rechazo email duplicado (409)
- ✅ Rechazo email inválido (422)
- ✅ Rechazo usuario inexistente (404)
- ✅ Rechazo request vacío (400)
- ✅ Audit trail actualizado (usr_modf, fch_modf)

**Phase 3a - CHANGE ROLE:**
- ✅ Cambio de MEDICOS → ESPECIALISTAS
- ✅ Cambio de ESPECIALISTAS → RECEPCION
- ✅ Rechazo mismo rol (409)
- ✅ Rechazo rol inexistente (404)
- ✅ Restauración a rol original

**Phase 3b - DEACTIVATE/ACTIVATE:**
- ✅ Desactivar usuario (est_usuario = 'B')
- ✅ Verificar estado inactivo
- ✅ Reactivar usuario (est_usuario = 'A')
- ✅ Verificar estado activo

### Cobertura de Casos de Uso

| Caso de Uso | Happy Path | Error Handling | Edge Cases |
|-------------|-----------|----------------|-----------|
| List Users | ✅ | ✅ | ✅ |
| Get User | ✅ | ✅ (404) | ✅ |
| Update User | ✅ | ✅ (400, 404, 409, 422) | ✅ |
| Change Role | ✅ | ✅ (404, 409) | ✅ |
| Deactivate/Activate | ✅ | ✅ (404) | ✅ |

---

## 🎓 Lecciones Aprendidas y Best Practices

### 1. Separación de Responsabilidades (SRP)

**Antes:**
```python
@app.route('/users/<id>', methods=['PATCH'])
def update_user(id):
    conn = mysql.connect(...)  # ❌ DB logic en route
    if not validate_email(data['email']):  # ❌ Business logic en route
        return {"error": "bad email"}, 400  # ❌ Error handling mezclado
    cursor.execute(f"UPDATE ... SET email='{data['email']}'")  # ❌ SQL injection
```

**Después:**
```python
# Route: solo HTTP
@users_bp.route("/<int:user_id>", methods=["PATCH"])
@jwt_required()
@requires_permission("usuarios:update")
def update_user(user_id: int):
    result, error = update_user_usecase.execute(user_id, data, current_user_id)
    if error:
        return jsonify(error_mapping[error]), status
    return jsonify(result), 200

# UseCase: solo business logic
class UpdateUserUseCase:
    def execute(self, user_id, data, modified_by):
        if not self._is_valid_email(data['email']):
            return None, "INVALID_EMAIL"
        ...

# Repository: solo SQL
class UserRepository:
    def update_user(self, user_id, data, modified_by):
        cursor.execute("UPDATE ... SET email = %s", (data['email'],))
```

### 2. Error Handling Predecible

**Patrón aplicado:**
```python
# Use case retorna tupla (result, error_code)
result, error = usecase.execute(...)

# Route mapea código → HTTP
error_mapping = {
    "USER_NOT_FOUND": (404, "Usuario no encontrado"),
    "EMAIL_DUPLICATE": (409, "El correo ya está en uso"),
}
status, message = error_mapping.get(error, (500, "Error desconocido"))
return jsonify({"code": error, "message": message}), status
```

**Beneficios:**
- Frontend puede manejar errores de forma consistente
- Cambiar mensajes no rompe frontend (el código es estable)
- Tests pueden verificar códigos, no strings

### 3. Validación en Múltiples Capas

```
Frontend (futuro)      →  UX, mensajes amigables
Route                  →  Estructura (JSON válido, tipos)
UseCase                →  Negocio (email único, formato)
Database               →  Constraints (UNIQUE, NOT NULL)
```

**Defense in depth:** Si una capa falla, las demás atajan.

### 4. Audit Trail Automático

**Anti-patrón:**
```python
# ❌ El developer tiene que acordarse
cursor.execute("UPDATE sy_usuarios SET nombre = %s WHERE id = %s", (name, id))
cursor.execute("UPDATE sy_usuarios SET usr_modf = %s, fch_modf = NOW() WHERE id = %s", (user, id))
```

**Patrón:**
```python
# ✅ El repository lo hace automáticamente
def update_user(self, user_id, data, modified_by):
    # ... construir updates ...
    updates.append("usr_modf = %s")
    updates.append("fch_modf = NOW()")
    params.append(modified_by)
```

### 5. Whitelist, No Blacklist

**Anti-patrón:**
```python
# ❌ Blacklist (fácil olvidar campos sensibles)
forbidden = ["clave", "usuario"]
for field in data:
    if field not in forbidden:
        updates.append(f"{field} = %s")  # Mass assignment attack!
```

**Patrón:**
```python
# ✅ Whitelist (solo lo que explícitamente permitimos)
allowed_fields = ["nombre", "paterno", "materno", "correo"]
for field in allowed_fields:
    if field in data:
        updates.append(f"{field} = %s")
```

---

## 🔮 Siguientes Pasos (Futuro)

### Deuda Técnica
- [ ] Tests unitarios con pytest (mock repositories)
- [ ] Tests de integración (Flask test client)
- [ ] Rate limiting real (Redis)
- [ ] Logging estructurado (no solo `print()`)
- [ ] Implementar `count_active_admins()` para validar último admin

### Features Propuestos
- [ ] `DELETE /users/<id>` (hard delete, solo super-admin)
- [ ] `GET /users/<id>/audit-log` (historial de cambios)
- [ ] `PATCH /users/<id>/password` (cambio de contraseña con validaciones)
- [ ] `POST /users/<id>/roles` (asignar múltiples roles)
- [ ] `DELETE /users/<id>/roles/<role_id>` (quitar rol secundario)

### Mejoras de Performance
- [ ] Connection pooling (hoy abre/cierra en cada query)
- [ ] Cache de roles con Redis
- [ ] Índices en `sy_usuarios(correo)`, `users_roles(id_usuario, id_rol)`

---

## 📖 Referencias

**Documentos del proyecto:**
- `PROJECT_GUIDE.md` - Guía técnica general del repo
- `AGENTS.md` - Configuración de agentes de IA
- `backend/docs/JWT_CSRF_MIGRATION.md` - Autenticación
- `backend/docs/RATE_LIMITING.md` - Rate limiting (propuesta)

**Patrones y principios:**
- Clean Architecture (Robert C. Martin)
- SOLID principles
- Repository Pattern (Fowler)
- Use Case pattern (Cockburn)

**Stack técnico:**
- Flask: https://flask.palletsprojects.com
- Flask-JWT-Extended: https://flask-jwt-extended.readthedocs.io
- MySQL Connector: https://dev.mysql.com/doc/connector-python

---

## 👥 Usuarios de Prueba

```
Admin:
  Usuario: testrbac
  Password: Test123!
  Permisos: * (todos)

Médico:
  Usuario: testmedico
  Password: Test123!
  Permisos: consultas médicas
```

**Base de datos:**
- Host: 10.15.15.76:3306
- Database: SIRES (antes dbsisem)
- Usuario: sires

---

**Fin del documento**  
Última actualización: 2025-12-30  
Autor: SIRES Development Team
