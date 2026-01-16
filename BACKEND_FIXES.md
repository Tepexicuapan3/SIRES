# Correcciones Requeridas en Backend (Estandarización de API)

> **Objetivo:** Alinear la respuesta del backend con el contrato de tipos definido en el frontend para garantizar consistencia, tipos de datos correctos y una estructura predecible.

## 🌍 Estandarización Global de Auditoría

Para todas las entidades (Usuarios, Roles, Permisos, Asignaciones), se deben utilizar los siguientes nombres estándar para metadatos de auditoría:

*   `fch_alta` -> **`created_at`** (ISO 8601 String)
*   `usr_alta` -> **`created_by`** (User ID o Username)
*   `fch_modf` -> **`updated_at`** (ISO 8601 String, Nullable)
*   `usr_modf` -> **`updated_by`** (User ID o Username, Nullable)
*   Para relaciones (tablas pivote):
    *   **`assigned_at`**
    *   **`assigned_by`**

Esta nomenclatura debe aplicarse en **todas** las respuestas JSON.

### 4. Endpoints Redundantes
*   **Problema:** El endpoint `GET /api/v1/permissions/users/:id/effective` es redundante.
*   **Solución:** Eliminarlo. La depuración se hace revisando Roles y Overrides en `GET /users/:id`.

## 🚨 Prioridad Alta: Integridad de Datos

### 1. Endpoint `GET /api/v1/auth/me` (CRÍTICO)
*   **Problema:** Actualmente solo devuelve `{ authenticated, id_usuario, scope, username }`.
*   **Impacto:** Rompe la persistencia de sesión. Al recargar la página (F5), el frontend no puede reconstruir los permisos ni el perfil del usuario.
*   **Solución:** Debe devolver el objeto `user` completo (idéntico al de `/login`).
*   **Requisito Vital:** El array `permissions` devuelto debe ser la **Lista Efectiva Calculada** (Roles + Overrides Allow - Overrides Deny).

### 2. Campo `rol_primario` en Auth
*   **Problema:** Ni `/login` ni `/me` indican cuál es el rol primario del usuario entre su lista de roles.
*   **Solución:** Incluir `rol_primario` (string) en el objeto `user` devuelto por ambos endpoints.

### 3. Endpoint `GET /api/v1/users` (Listado)
*   **Problema:** Falta el campo `last_conexion` en el objeto de usuario de la lista.
*   **Problema:** Inconsistencia en el nombre del rol. A veces es `rol_primario`, se debe asegurar que siempre sea así.
*   **Problema:** El filtro de query params usa `estado` ("A"/"B").
*   **Solución:**
    *   Asegurar que el serializador o query incluya `last_conexion` y `rol_primario`.
    *   Cambiar el parámetro de filtro `estado` por `is_active` (boolean string: "true"/"false").

### 2. Endpoint `GET /api/v1/users/:id` (Detalle)
*   **Problema Crítico:** Devuelve un objeto anidado `det_usuario` con campos importantes (`last_conexion`, `terminos_acept`, etc.).
*   **Solución:** "Aplanar" la respuesta. Todos los campos deben estar en el nivel raíz del objeto `user`.
    *   ❌ `user.det_usuario.last_conexion`
    *   ✅ `user.last_conexion`
    *   ✅ `user.terminos_acept`
    *   ✅ `user.ip_ultima`
*   **Problema (RBAC 2.0):** Falta la lista de `overrides` (excepciones de permisos) en el detalle.
*   **Solución:** Incluir un array `overrides` en la respuesta raíz (junto a `roles`).

### 3. Tipos de Datos (Booleanos)
*   **Problema:** Los campos `terminos_acept` y `cambiar_clave` (o similares) se retornan como strings `"T"` o `"F"`.
*   **Problema:** El campo `est_usuario` retorna `"A"` (Activo) o `"B"` (Baja), lo cual es nomenclatura interna de BD.
*   **Solución:**
    *   Convertir `"T"/"F"` a `true/false`.
    *   Reemplazar `est_usuario` por `is_active` (boolean):
        *   `"A"` -> `true`
        *   `"B"` -> `false`

### 4. Endpoint `POST /api/v1/users` (Crear)
*   **Problema:** Falta devolver `rol_asignado` en la estructura de respuesta para confirmación inmediata en UI.
*   **Solución:** Incluir el ID del rol asignado en `response.user`.

### 5. Campos de Seguridad (Rate Limiting)
*   **Problema:** La respuesta incluye `intentos_fallidos` y `fecha_bloqueo` provenientes de la BD (tabla `det_usuarios`).
*   **Contexto:** El Rate Limiting se gestiona en Redis (infraestructura), no en MySQL. Estos campos en BD son obsoletos o redundantes.
*   **Solución:** Eliminar estos campos de la respuesta `UserDetail`. Si se requiere ver el estado de bloqueo, debe consultarse al servicio de Rate Limiting explícitamente.

## 🎭 Roles

### 1. Endpoint `GET /api/v1/roles` (Listado)
*   **Problema:** No devuelve metadatos de paginación (`page`, `page_size`, `total_pages`).
*   **Problema:** El array de roles viene bajo la clave `roles` en lugar del estándar `items`.
*   **Solución:** Implementar el Wrapper de Colección estándar: `{ items: [...], total, page, ... }`.

### 2. Tipos de Datos y Redundancia
*   **Problema:** `est_rol` usa `"A"/"B"`. Cambiar a `is_active` (boolean).
*   **Problema:** `is_admin` se devuelve como `0/1`. Cambiar a `boolean`.
*   **Problema:** `is_admin` es redundante si se usa el permiso wildcard `*`.
*   **Problema:** `tp_rol` usa códigos crípticos (ej: "X").
*   **Problema:** `priority` ya no es necesaria tras la implementación de `rol_primario` explícito.
*   **Solución:**
    *   Eliminar `is_admin` de la respuesta y asegurar que el rol de administrador tenga asignado el permiso `*`.
    *   Eliminar el campo `priority`.
    *   Reemplazar `tp_rol` por `is_system` (boolean):
        *   True si el rol es protegido/del sistema (ej: ID <= 22).
        *   False si es un rol personalizado.

### 3. Endpoint `POST /api/v1/roles` (Crear)
*   **Problema:** Devuelve el objeto completo del rol.
*   **Solución:** Devolver respuesta mínima: `{ message, id_rol, rol }`.

### 4. Endpoint `PUT /api/v1/roles/:id` (Actualizar)
*   **Problema:** No permite cambiar el estado del rol.
*   **Solución:** Debe aceptar el campo `is_active` (boolean) para activar/desactivar el rol.

## 🔐 Permisos (Code-First Strategy)

### 1. Simplificación de Entidad
*   **Problema:** La tabla de permisos tiene columnas redundantes (`category`, `resource`, `action`, `is_system`, `est_permission`).
*   **Estrategia:** Los permisos son estructurales (definidos en código `GRUPO:MODULO:ACCION`).
*   **Solución:**
    *   Eliminar columnas de metadatos.
    *   Mantener solo `id`, `code`, `description` y auditoría (`created_at`).
    *   Eliminar `is_system` y `est_permission`.

### 2. Endpoint `GET /api/v1/permissions` (Catálogo)
*   **Problema:** Devuelve `{ permissions: [...] }`.
*   **Solución:** Devolver el wrapper estándar `{ items: [...], total }`. No es necesaria paginación compleja, pero el formato debe ser consistente.

### 3. Endpoints CRUD
*   **Solución:** Eliminar endpoints de creación/edición/borrado manual (`POST`, `PUT`, `DELETE`). Los permisos se deben gestionar vía migraciones de base de datos, no por UI.

## 🛠️ Resumen de Contrato (JSON Esperado)

### User Entity (Estándar)
```json
{
  "id_usuario": 123,
  "usuario": "jperez",
  "nombre": "Juan",
  "paterno": "Perez",
  "materno": "Lopez",
  "correo": "juan@test.com",
  "rol_primario": "MEDICO",  // OBLIGATORIO
  "is_active": true,         // Boolean, NO "A"/"B"
  "last_conexion": "2026-01-14T10:00:00", // ISO String, NO null si existe
  
  // Solo en Detalle (pero planos):
  "terminos_acept": true,    // Boolean, NO "T"
  "cambiar_clave": false,    // Boolean, NO "F"
  "ip_ultima": "192.168.1.1"
  // ELIMINADOS: intentos_fallidos, fecha_bloqueo
}
```

## 📂 Archivos Afectados (Sugeridos)
*   `backend/src/use_cases/users/get_user_usecase.py`: Lógica de aplanado de `det_usuario`.
*   `backend/src/use_cases/users/list_users_usecase.py`: Inclusión de campos faltantes.
*   `backend/src/infrastructure/repositories/user_repository.py`: Queries SQL/ORM.
