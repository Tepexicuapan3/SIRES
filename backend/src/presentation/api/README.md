# API Layer - Backend (Flask)

Este directorio contiene los Blueprints y rutas de la API RESTful de SIRES.

---

## 📐 Estándares de Diseño de API

### 1. Estructura de Respuesta Unificada
Toda respuesta de la API (excepto descargas de archivos) debe seguir estrictamente este formato JSON:

#### Éxito (2xx)
```json
// Respuesta Singular
{
  "message": "Operación exitosa", // Opcional
  "data": { ... }                 // Objeto principal o claves semánticas (user, role, etc.)
}

// Respuesta de Colección (Listados)
{
  "items": [ ... ],       // Array de entidades
  "page": 1,              // Página actual
  "page_size": 20,        // Items por página
  "total": 150,           // Total en BD
  "total_pages": 8
}
```

#### Error (4xx, 5xx)
Utilizar siempre el helper `error_helpers.py` para garantizar consistencia.

```json
{
  "code": "USER_NOT_FOUND",      // Código de error legible por máquina (SNAKE_CASE)
  "message": "El usuario no existe" // Mensaje legible por humano (Español)
}
```

### 2. Códigos de Estado HTTP
*   `200 OK`: Consulta exitosa o actualización exitosa.
*   `201 Created`: Recurso creado exitosamente (POST).
*   `204 No Content`: Eliminación exitosa o acción sin retorno (DELETE).
*   `400 Bad Request`: Error de validación o formato.
*   `401 Unauthorized`: No autenticado o token inválido.
*   `403 Forbidden`: Autenticado pero sin permiso (RBAC).
*   `404 Not Found`: Recurso no encontrado.
*   `409 Conflict`: Violación de unicidad (ej: email duplicado).
*   `422 Unprocessable Entity`: Error semántico en datos.
*   `500 Server Error`: Error no controlado o fallo de infraestructura.

---

## 🛡️ Seguridad y Autenticación

### Decoradores
Cada ruta debe estar protegida explícitamente usando los decoradores disponibles en `src/infrastructure/authorization/decorators.py`:

```python
@jwt_required()                  # 1. Valida Token JWT
@requires_permission("roles:create") # 2. Valida Permiso RBAC
def create_role():
    ...
```

### Cookies HttpOnly
La autenticación se maneja exclusivamente vía Cookies. **NUNCA** devolver tokens en el cuerpo de la respuesta JSON.
*   `access_token_cookie`: JWT de acceso (corta duración).
*   `refresh_token_cookie`: JWT de renovación (larga duración).
*   `csrf_access_token`: Token CSRF (legible por JS).

---

## 📂 Organización del Código

*   **`*_routes.py`**: Definición de Blueprints y endpoints. Solo deben contener lógica de presentación (validación de request, mapeo de respuesta). La lógica de negocio DEBE estar en los **Use Cases**.
*   **`error_helpers.py`**: Catálogo centralizado de códigos de error.

### Flujo de una Petición
1.  **Route**: Recibe request JSON -> Valida inputs básicos.
2.  **Use Case**: Ejecuta lógica de negocio -> Retorna `(result, error_code)`.
3.  **Route**:
    *   Si hay error: Busca mensaje en `error_helpers` -> Retorna JSON Error.
    *   Si hay éxito: Formatea JSON -> Retorna 200/201.

---

## 📝 Guía de Desarrollo

### Agregar un Nuevo Endpoint

1.  Definir el caso de uso en `src/use_cases/`.
2.  Crear la ruta en el archivo `*_routes.py` correspondiente.
3.  Proteger la ruta con `@jwt_required()` y `@requires_permission(...)`.
4.  Usar `try/except` general para capturar errores 500.
5.  Documentar el endpoint con Docstring detallando:
    *   Permisos requeridos.
    *   Estructura del Body.
    *   Respuestas de éxito y error.

```python
@bp.route("/items", methods=["POST"])
@jwt_required()
@requires_permission("items:create")
def create_item():
    """
    Crea un nuevo ítem.
    Requiere permiso: items:create
    ...
    """
    # Implementación
```
