"""
Roles Routes - Endpoints para gestión CRUD de roles RBAC

Endpoints protegidos por permisos:
- POST   /api/v1/roles           -> roles:create
- GET    /api/v1/roles           -> roles:read
- GET    /api/v1/roles/<id>      -> roles:read
- PUT    /api/v1/roles/<id>      -> roles:update
- DELETE /api/v1/roles/<id>      -> roles:delete
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from src.infrastructure.authorization.decorators import requires_permission
from src.infrastructure.authorization.authorization_service import authorization_service
from src.use_cases.roles import (
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    GetRolesUseCase
)

roles_bp = Blueprint("roles", __name__)


# ============= CREATE ROLE =============
@roles_bp.route("", methods=["POST"])
@jwt_required()
@requires_permission("roles:create")
def create_role():
    """
    Crea un nuevo rol.
    Requiere permiso: roles:create
    
    Body:
        {
            "rol": "ENFERMERIA",
            "desc_rol": "Personal de enfermería",
            "tp_rol": "ADMIN",          # Opcional, default: "ADMIN"
            "landing_route": "/nursing", # Opcional
            "priority": 5,               # Opcional, default: 999
            "is_admin": false            # Opcional, default: false
        }
    
    Response 201:
        {
            "id_rol": 23,
            "rol": "ENFERMERIA",
            "desc_rol": "Personal de enfermería",
            ...
        }
    
    Errors:
        400 - ROLE_NAME_REQUIRED, ROLE_NAME_INVALID, ROLE_NAME_DUPLICATE, etc.
        500 - DATABASE_ERROR
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validar datos mínimos
        if not data:
            return jsonify({"error": "INVALID_REQUEST", "message": "Body es requerido"}), 400
        
        if not data.get("rol"):
            return jsonify({"error": "ROLE_NAME_REQUIRED", "message": "El nombre del rol es requerido"}), 400
        
        if not data.get("desc_rol"):
            return jsonify({"error": "ROLE_DESCRIPTION_REQUIRED", "message": "La descripción del rol es requerida"}), 400
        
        # Ejecutar use case
        use_case = CreateRoleUseCase()
        role, error = use_case.execute(
            rol=data.get("rol"),
            desc_rol=data.get("desc_rol"),
            tp_rol=data.get("tp_rol", "ADMIN"),
            landing_route=data.get("landing_route"),
            priority=data.get("priority", 999),
            is_admin=data.get("is_admin", False),
            usr_alta=str(current_user_id)
        )
        
        if error:
            # Mapear errores a códigos HTTP
            status_code = 400
            if "DATABASE_ERROR" in error:
                status_code = 500
            elif error == "ROLE_NAME_DUPLICATE":
                status_code = 409  # Conflict
            
            return jsonify({"error": error, "message": _get_error_message(error)}), status_code
        
        # Invalidar cache de permisos (aunque crear rol no afecta permisos directamente,
        # es buena práctica invalidar cuando se modifica estructura RBAC)
        authorization_service.invalidate_cache()
        
        return jsonify(role), 201
    
    except Exception as e:
        return jsonify({
            "error": "SERVER_ERROR",
            "message": f"Error al crear rol: {str(e)}"
        }), 500


# ============= GET ALL ROLES =============
@roles_bp.route("", methods=["GET"])
@jwt_required()
@requires_permission("roles:read")
def get_all_roles():
    """
    Obtiene lista de todos los roles con counts de permisos y usuarios.
    Requiere permiso: roles:read
    
    Query params:
        ?include_inactive=true  # Incluir roles inactivos (default: false)
    
    Response 200:
        {
            "total": 23,
            "roles": [
                {
                    "id_rol": 1,
                    "rol": "MEDICOS",
                    "desc_rol": "Médicos del servicio",
                    "landing_route": "/consultas",
                    "priority": 2,
                    "is_admin": 0,
                    "est_rol": "A",
                    "permissions_count": 45,
                    "users_count": 12
                },
                ...
            ]
        }
    """
    try:
        include_inactive = request.args.get("include_inactive", "false").lower() == "true"
        
        use_case = GetRolesUseCase()
        roles = use_case.get_all(include_inactive=include_inactive)
        
        return jsonify({
            "total": len(roles),
            "roles": roles
        }), 200
    
    except Exception as e:
        return jsonify({
            "error": "SERVER_ERROR",
            "message": f"Error al obtener roles: {str(e)}"
        }), 500


# ============= GET ROLE BY ID =============
@roles_bp.route("/<int:role_id>", methods=["GET"])
@jwt_required()
@requires_permission("roles:read")
def get_role_by_id(role_id: int):
    """
    Obtiene detalle de un rol específico.
    Requiere permiso: roles:read
    
    Response 200:
        {
            "id_rol": 5,
            "rol": "ENFERMERIA",
            "desc_rol": "Personal de enfermería",
            ...
        }
    
    Response 404:
        { "error": "ROLE_NOT_FOUND" }
    """
    try:
        use_case = GetRolesUseCase()
        role = use_case.get_by_id(role_id)
        
        if not role:
            return jsonify({
                "error": "ROLE_NOT_FOUND",
                "message": f"Rol con ID {role_id} no encontrado"
            }), 404
        
        return jsonify(role), 200
    
    except Exception as e:
        return jsonify({
            "error": "SERVER_ERROR",
            "message": f"Error al obtener rol: {str(e)}"
        }), 500


# ============= UPDATE ROLE =============
@roles_bp.route("/<int:role_id>", methods=["PUT"])
@jwt_required()
@requires_permission("roles:update")
def update_role(role_id: int):
    """
    Actualiza un rol existente.
    Requiere permiso: roles:update
    
    Body (todos opcionales, enviar solo lo que se quiere cambiar):
        {
            "rol": "NUEVO_NOMBRE",
            "desc_rol": "Nueva descripción",
            "landing_route": "/nueva-ruta",
            "priority": 10
        }
    
    Response 200:
        { ... rol actualizado ... }
    
    Errors:
        400 - ROLE_NOT_FOUND, ROLE_SYSTEM_PROTECTED, etc.
        404 - Rol no existe
        500 - DATABASE_ERROR
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "INVALID_REQUEST", "message": "Body es requerido"}), 400
        
        # Filtrar campos permitidos
        allowed_fields = ['rol', 'desc_rol', 'tp_rol', 'landing_route', 'priority']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({
                "error": "NO_FIELDS_TO_UPDATE",
                "message": "No se proporcionó ningún campo válido para actualizar"
            }), 400
        
        # Ejecutar use case
        use_case = UpdateRoleUseCase()
        role, error = use_case.execute(
            role_id=role_id,
            usr_modf=str(current_user_id),
            **update_data
        )
        
        if error:
            # Mapear errores a códigos HTTP
            status_code = 400
            if "DATABASE_ERROR" in error:
                status_code = 500
            elif error == "ROLE_NOT_FOUND":
                status_code = 404
            elif error == "ROLE_SYSTEM_PROTECTED":
                status_code = 403  # Forbidden
            elif error == "ROLE_NAME_DUPLICATE":
                status_code = 409  # Conflict
            
            return jsonify({"error": error, "message": _get_error_message(error)}), status_code
        
        # Invalidar cache de permisos
        authorization_service.invalidate_cache()
        
        return jsonify(role), 200
    
    except Exception as e:
        return jsonify({
            "error": "SERVER_ERROR",
            "message": f"Error al actualizar rol: {str(e)}"
        }), 500


# ============= DELETE ROLE =============
@roles_bp.route("/<int:role_id>", methods=["DELETE"])
@jwt_required()
@requires_permission("roles:delete")
def delete_role(role_id: int):
    """
    Elimina un rol (baja lógica).
    Requiere permiso: roles:delete
    
    Response 204:
        (sin contenido, eliminación exitosa)
    
    Errors:
        400 - ROLE_SYSTEM_PROTECTED, ROLE_HAS_USERS
        404 - ROLE_NOT_FOUND
        500 - DATABASE_ERROR
    """
    try:
        current_user_id = int(get_jwt_identity())
        
        # Ejecutar use case
        use_case = DeleteRoleUseCase()
        success, error = use_case.execute(
            role_id=role_id,
            usr_baja=str(current_user_id)
        )
        
        if error:
            # Mapear errores a códigos HTTP
            status_code = 400
            if "DATABASE_ERROR" in error:
                status_code = 500
            elif error == "ROLE_NOT_FOUND":
                status_code = 404
            elif error == "ROLE_SYSTEM_PROTECTED":
                status_code = 403  # Forbidden
            
            return jsonify({"error": error, "message": _get_error_message(error)}), status_code
        
        # Invalidar cache de permisos
        authorization_service.invalidate_cache()
        
        return "", 204  # No Content
    
    except Exception as e:
        return jsonify({
            "error": "SERVER_ERROR",
            "message": f"Error al eliminar rol: {str(e)}"
        }), 500


# ============= HELPER: Mensajes de Error =============
def _get_error_message(error_code: str) -> str:
    """Mapea códigos de error a mensajes en español"""
    messages = {
        "ROLE_NAME_REQUIRED": "El nombre del rol es requerido",
        "ROLE_NAME_INVALID": "El nombre del rol contiene caracteres inválidos (solo letras, números, espacios, guiones)",
        "ROLE_NAME_TOO_LONG": "El nombre del rol no puede exceder 50 caracteres",
        "ROLE_DESCRIPTION_REQUIRED": "La descripción del rol es requerida",
        "ROLE_DESCRIPTION_TOO_LONG": "La descripción no puede exceder 200 caracteres",
        "ROLE_NAME_DUPLICATE": "Ya existe un rol con ese nombre",
        "INVALID_PRIORITY": "La prioridad debe ser un número positivo",
        "INVALID_LANDING_ROUTE": "La ruta debe comenzar con /",
        "ROLE_NOT_FOUND": "Rol no encontrado",
        "ROLE_SYSTEM_PROTECTED": "Los roles del sistema no pueden ser modificados o eliminados",
        "ROLE_HAS_USERS": "No se puede eliminar un rol que tiene usuarios asignados",
        "NO_FIELDS_TO_UPDATE": "No se proporcionó ningún campo para actualizar",
        "DATABASE_ERROR": "Error de base de datos"
    }
    return messages.get(error_code, error_code)
