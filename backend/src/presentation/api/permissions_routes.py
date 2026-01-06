"""
Permissions Routes - Endpoints para administración de permisos RBAC 2.0

Endpoints implementados:
- GET /me - Permisos del usuario autenticado
- GET /catalog - Catálogo completo de permisos (admin)
- GET /user/<id> - Permisos de un usuario
- POST /role/<id>/assign - Asignar permiso a rol
- POST /role/<id>/revoke - Revocar permiso de rol
- POST /cache/invalidate - Invalidar cache
- GET /roles - Listar todos los roles
- GET /role/<id> - Permisos de un rol
- POST / - Crear permiso custom (Fase 2)
- GET / - Listar permisos (Fase 2)
- GET /<id> - Detalle de permiso (Fase 2)
- PUT /<id> - Actualizar permiso (Fase 2)
- DELETE /<id> - Eliminar permiso (Fase 2)
- POST /assign - Asignar múltiples permisos a rol (Fase 2)
- DELETE /roles/<role_id>/permissions/<perm_id> - Quitar permiso de rol (Fase 2)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from src.infrastructure.authorization.decorators import (
    requires_permission,
    requires_any_permission,
    admin_required
)
from src.infrastructure.authorization.authorization_service import authorization_service
from src.infrastructure.repositories.permission_repository import PermissionRepository
from src.use_cases.permissions.create_permission import CreatePermissionUseCase
from src.use_cases.permissions.update_permission import UpdatePermissionUseCase
from src.use_cases.permissions.delete_permission import DeletePermissionUseCase
from src.use_cases.permissions.get_permissions import GetPermissionsUseCase
from src.use_cases.permissions.assign_permissions_to_role import AssignPermissionsToRoleUseCase

permissions_bp = Blueprint("permissions", __name__)
permission_repo = PermissionRepository()

# Inicializar use cases (Fase 2)
create_permission_uc = CreatePermissionUseCase(permission_repo)
update_permission_uc = UpdatePermissionUseCase(permission_repo)
delete_permission_uc = DeletePermissionUseCase(permission_repo)
get_permissions_uc = GetPermissionsUseCase(permission_repo)
assign_permissions_uc = AssignPermissionsToRoleUseCase(permission_repo, authorization_service)

# Inicializar use cases
create_permission_uc = CreatePermissionUseCase(permission_repo)
update_permission_uc = UpdatePermissionUseCase(permission_repo)
delete_permission_uc = DeletePermissionUseCase(permission_repo)
get_permissions_uc = GetPermissionsUseCase(permission_repo)
assign_permissions_uc = AssignPermissionsToRoleUseCase(permission_repo, authorization_service)


# ============= GET USER PERMISSIONS (Public para el usuario autenticado) =============
@permissions_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_permissions():
    """
    Obtiene permisos, roles y landing route del usuario autenticado.
    
    Response:
        {
            "user_id": 123,
            "is_admin": false,
            "roles": [...],
            "permissions_count": 25,
            "permissions": ["expedientes:read", "consultas:create", ...],
            "landing_route": "/consultas",
            "cached": true
        }
    """
    user_id = int(get_jwt_identity())
    summary = authorization_service.get_permission_summary(user_id)
    
    return jsonify(summary), 200


# ============= LIST ALL PERMISSIONS (Admin only) =============
@permissions_bp.route("/catalog", methods=["GET"])
@jwt_required()
@admin_required()
def get_permissions_catalog():
    """
    Obtiene el catálogo completo de permisos disponibles.
    Solo administradores pueden ver esto.
    
    Response:
        [
            {
                "id_permission": 1,
                "code": "expedientes:create",
                "resource": "expedientes",
                "action": "create",
                "description": "Crear nuevo expediente",
                "category": "EXPEDIENTES"
            },
            ...
        ]
    """
    try:
        permissions = permission_repo.get_all_permissions()
        
        # Agrupar por categoría (opcional)
        by_category = {}
        for perm in permissions:
            category = perm.get("category", "OTHER")
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(perm)
        
        return jsonify({
            "total": len(permissions),
            "permissions": permissions,
            "by_category": by_category
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al obtener catálogo de permisos: {str(e)}"
        }), 500


# ============= GET USER PERMISSIONS BY ID (Requires permission) =============
@permissions_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
@requires_permission("usuarios:read")
def get_user_permissions(user_id: int):
    """
    Obtiene los permisos efectivos de un usuario específico.
    Requiere permiso: usuarios:read
    
    Response:
        {
            "user_id": 456,
            "is_admin": false,
            "roles": [...],
            "permissions": [...]
        }
    """
    try:
        summary = authorization_service.get_permission_summary(user_id)
        return jsonify(summary), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al obtener permisos del usuario: {str(e)}"
        }), 500


# ============= ASSIGN PERMISSION TO ROLE (Admin only) =============
@permissions_bp.route("/role/<int:role_id>/assign", methods=["POST"])
@jwt_required()
@admin_required()
def assign_permission_to_role(role_id: int):
    """
    Asigna un permiso a un rol.
    Solo administradores.
    
    Body:
        {
            "permission_id": 15
        }
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data or "permission_id" not in data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "permission_id es requerido"
            }), 400
        
        permission_id = data["permission_id"]
        
        success = permission_repo.assign_permission_to_role(
            role_id=role_id,
            permission_id=permission_id,
            user_id=current_user_id
        )
        
        if success:
            # Invalidar cache de permisos (todos los usuarios con este rol)
            authorization_service.invalidate_cache()
            
            return jsonify({
                "message": "Permiso asignado correctamente",
                "role_id": role_id,
                "permission_id": permission_id
            }), 200
        else:
            return jsonify({
                "code": "ASSIGNMENT_FAILED",
                "message": "No se pudo asignar el permiso"
            }), 500
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al asignar permiso: {str(e)}"
        }), 500


# ============= REVOKE PERMISSION FROM ROLE (Admin only) =============
@permissions_bp.route("/role/<int:role_id>/revoke", methods=["POST"])
@jwt_required()
@admin_required()
def revoke_permission_from_role(role_id: int):
    """
    Revoca un permiso de un rol.
    Solo administradores.
    
    Body:
        {
            "permission_id": 15
        }
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data or "permission_id" not in data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "permission_id es requerido"
            }), 400
        
        permission_id = data["permission_id"]
        
        success = permission_repo.revoke_permission_from_role(
            role_id=role_id,
            permission_id=permission_id,
            user_id=current_user_id
        )
        
        if success:
            # Invalidar cache
            authorization_service.invalidate_cache()
            
            return jsonify({
                "message": "Permiso revocado correctamente",
                "role_id": role_id,
                "permission_id": permission_id
            }), 200
        else:
            return jsonify({
                "code": "NOT_FOUND",
                "message": "Permiso no encontrado en el rol o ya estaba revocado"
            }), 404
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al revocar permiso: {str(e)}"
        }), 500


# ============= INVALIDATE CACHE (Admin only) =============
@permissions_bp.route("/cache/invalidate", methods=["POST"])
@jwt_required()
@admin_required()
def invalidate_permissions_cache():
    """
    Invalida el cache de permisos.
    Útil después de modificar permisos masivamente.
    """
    try:
        data = request.get_json() or {}
        user_id = data.get("user_id")  # Opcional
        
        if user_id:
            authorization_service.invalidate_cache(user_id)
            message = f"Cache invalidado para usuario {user_id}"
        else:
            authorization_service.invalidate_cache()
            message = "Cache de permisos invalidado completamente"
        
        return jsonify({"message": message}), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al invalidar cache: {str(e)}"
        }), 500


# ============= GET ALL ROLES (Admin only) =============
@permissions_bp.route("/roles", methods=["GET"])
@jwt_required()
@admin_required()
def get_all_roles():
    """
    Obtiene todos los roles con sus counts de permisos.
    Solo administradores.
    
    Response:
        [
            {
                "id_rol": 1,
                "cod_rol": "ADMINISTRADOR",
                "nom_rol": "Administradores del Sistema",
                "landing_route": "/admin",
                "priority": 1,
                "is_admin": 1,
                "permissions_count": 127
            },
            ...
        ]
    """
    try:
        roles = permission_repo.get_all_roles()
        
        return jsonify({
            "total": len(roles),
            "roles": roles
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al obtener roles: {str(e)}"
        }), 500


# ============= GET ROLE PERMISSIONS (Admin only) =============
@permissions_bp.route("/role/<int:role_id>", methods=["GET"])
@jwt_required()
@admin_required()
def get_role_permissions_endpoint(role_id: int):
    """
    Obtiene todos los permisos asignados a un rol específico.
    Solo administradores.
    
    Response:
        {
            "role_id": 2,
            "total": 19,
            "permissions": [
                {
                    "id_permission": 5,
                    "code": "expedientes:read",
                    "resource": "expedientes",
                    "action": "read",
                    "description": "Ver expedientes",
                    "category": "EXPEDIENTES"
                },
                ...
            ]
        }
    """
    try:
        permissions = permission_repo.get_permissions_by_role_id(role_id)
        
        return jsonify({
            "role_id": role_id,
            "total": len(permissions),
            "permissions": permissions
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al obtener permisos del rol: {str(e)}"
        }), 500
# ========== NUEVOS ENDPOINTS CRUD DE PERMISOS (Fase 2) ==========

# Mapeo de códigos de error a HTTP status codes
ERROR_MAP = {
    "PERMISSION_CODE_REQUIRED": (400, "Código de permiso requerido"),
    "PERMISSION_CODE_INVALID": (400, "Formato de código inválido (debe ser resource:action)"),
    "PERMISSION_CODE_TOO_LONG": (400, "Código muy largo (máximo 100 caracteres)"),
    "PERMISSION_RESOURCE_REQUIRED": (400, "Resource requerido"),
    "PERMISSION_ACTION_REQUIRED": (400, "Action requerido"),
    "PERMISSION_CODE_MISMATCH": (400, "Código debe ser resource:action"),
    "PERMISSION_CODE_EXISTS": (409, "Ya existe un permiso con ese código"),
    "PERMISSION_DESCRIPTION_TOO_LONG": (400, "Descripción muy larga (máximo 255 caracteres)"),
    "PERMISSION_CATEGORY_TOO_LONG": (400, "Categoría muy larga (máximo 50 caracteres)"),
    "PERMISSION_NOT_FOUND": (404, "Permiso no encontrado"),
    "PERMISSION_SYSTEM_PROTECTED": (403, "No se pueden modificar permisos del sistema"),
    "PERMISSION_IN_USE": (400, "Permiso asignado a roles, no se puede eliminar"),
    "ROLE_NOT_FOUND": (404, "Rol no encontrado"),
    "INVALID_PERMISSIONS": (400, "Uno o más permisos no existen"),
    "EMPTY_PERMISSION_LIST": (400, "La lista de permisos no puede estar vacía"),
    "DB_CONNECTION_FAILED": (500, "Error de conexión a base de datos"),
}


@permissions_bp.route("/", methods=["POST"])
@jwt_required()
@requires_permission("permisos:create")
def create_permission():
    """
    Crea un nuevo permiso custom.
    Requiere permiso: permisos:create
    
    Body:
        {
            "code": "expedientes:export",
            "resource": "expedientes",
            "action": "export",
            "description": "Exportar expedientes a PDF/Excel",
            "category": "Expedientes"
        }
    
    Response 201:
        {
            "message": "Permiso creado exitosamente",
            "permission": {
                "id_permission": 70,
                "code": "expedientes:export",
                "resource": "expedientes",
                "action": "export",
                "description": "Exportar expedientes a PDF/Excel",
                "category": "Expedientes",
                "is_system": false
            }
        }
    """
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Body JSON requerido"
            }), 400
        
        # Validar campos requeridos
        required = ["code", "resource", "action"]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "code": "MISSING_REQUIRED_FIELDS",
                "message": f"Campos requeridos faltantes: {', '.join(missing)}"
            }), 400
        
        # Ejecutar use case
        permission, error = create_permission_uc.execute(
            code=data["code"],
            resource=data["resource"],
            action=data["action"],
            description=data.get("description"),
            category=data.get("category"),
            usr_alta=current_user
        )
        
        if error:
            status, message = ERROR_MAP.get(error, (500, error))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Permiso creado exitosamente",
            "permission": permission
        }), 201
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al crear permiso: {str(e)}"
        }), 500


@permissions_bp.route("/", methods=["GET"])
@jwt_required()
@requires_permission("permisos:read")
def list_permissions():
    """
    Lista todos los permisos disponibles.
    Requiere permiso: permisos:read
    
    Response 200:
        {
            "permissions": [
                {
                    "id_permission": 1,
                    "code": "expedientes:read",
                    "resource": "expedientes",
                    "action": "read",
                    "description": "Ver expedientes",
                    "category": "Expedientes"
                },
                ...
            ]
        }
    """
    try:
        permissions = get_permissions_uc.get_all()
        
        return jsonify({
            "permissions": permissions
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al listar permisos: {str(e)}"
        }), 500


@permissions_bp.route("/<int:permission_id>", methods=["GET"])
@jwt_required()
@requires_permission("permisos:read")
def get_permission_detail(permission_id: int):
    """
    Obtiene detalle de un permiso específico.
    Requiere permiso: permisos:read
    
    Response 200:
        {
            "permission": {
                "id_permission": 5,
                "code": "expedientes:read",
                "resource": "expedientes",
                "action": "read",
                "description": "Ver expedientes",
                "category": "Expedientes",
                "is_system": true
            }
        }
    """
    try:
        permission = get_permissions_uc.get_by_id(permission_id)
        
        if not permission:
            return jsonify({
                "code": "PERMISSION_NOT_FOUND",
                "message": "Permiso no encontrado"
            }), 404
        
        return jsonify({
            "permission": permission
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al obtener permiso: {str(e)}"
        }), 500


@permissions_bp.route("/<int:permission_id>", methods=["PUT"])
@jwt_required()
@requires_permission("permisos:update")
def update_permission_endpoint(permission_id: int):
    """
    Actualiza un permiso custom (solo descripción y categoría).
    No permite modificar permisos del sistema.
    Requiere permiso: permisos:update
    
    Body:
        {
            "description": "Nueva descripción del permiso",
            "category": "Nueva categoría"
        }
    
    Response 200:
        {
            "message": "Permiso actualizado exitosamente",
            "permission": {...}
        }
    """
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Body JSON requerido"
            }), 400
        
        # Ejecutar use case
        permission, error = update_permission_uc.execute(
            permission_id=permission_id,
            description=data.get("description"),
            category=data.get("category"),
            usr_modf=current_user
        )
        
        if error:
            status, message = ERROR_MAP.get(error, (500, error))
            return jsonify({"code": error, "message": message}), status
        
        # Invalidar cache
        authorization_service.invalidate_cache()
        
        return jsonify({
            "message": "Permiso actualizado exitosamente",
            "permission": permission
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al actualizar permiso: {str(e)}"
        }), 500


@permissions_bp.route("/<int:permission_id>", methods=["DELETE"])
@jwt_required()
@requires_permission("permisos:delete")
def delete_permission_endpoint(permission_id: int):
    """
    Elimina un permiso custom (baja lógica).
    No permite eliminar permisos del sistema o asignados a roles.
    Requiere permiso: permisos:delete
    
    Response 204:
        (Sin contenido)
    """
    try:
        current_user = get_jwt_identity()
        
        # Ejecutar use case
        success, error = delete_permission_uc.execute(
            permission_id=permission_id,
            usr_baja=current_user
        )
        
        if error:
            status, message = ERROR_MAP.get(error, (500, error))
            return jsonify({"code": error, "message": message}), status
        
        # Invalidar cache
        authorization_service.invalidate_cache()
        
        return "", 204
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al eliminar permiso: {str(e)}"
        }), 500


@permissions_bp.route("/assign", methods=["POST"])
@jwt_required()
@requires_permission("permisos:assign")
def assign_permissions_to_role_endpoint():
    """
    Asigna múltiples permisos a un rol (operación transaccional).
    Requiere permiso: permisos:assign
    
    Body:
        {
            "role_id": 5,
            "permission_ids": [1, 5, 10, 15]
        }
    
    Response 200:
        {
            "message": "Permisos asignados exitosamente",
            "role_id": 5,
            "assigned_count": 4
        }
    """
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Body JSON requerido"
            }), 400
        
        # Validar campos requeridos
        if "role_id" not in data or "permission_ids" not in data:
            return jsonify({
                "code": "MISSING_REQUIRED_FIELDS",
                "message": "role_id y permission_ids son requeridos"
            }), 400
        
        role_id = data["role_id"]
        permission_ids = data["permission_ids"]
        
        # Validar que permission_ids sea una lista
        if not isinstance(permission_ids, list):
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "permission_ids debe ser un array"
            }), 400
        
        # Ejecutar use case
        success, error = assign_permissions_uc.execute(
            role_id=role_id,
            permission_ids=permission_ids,
            usr_alta=current_user
        )
        
        if error:
            status, message = ERROR_MAP.get(error, (500, error))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Permisos asignados exitosamente",
            "role_id": role_id,
            "assigned_count": len(permission_ids)
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al asignar permisos: {str(e)}"
        }), 500


@permissions_bp.route("/roles/<int:role_id>/permissions/<int:permission_id>", methods=["DELETE"])
@jwt_required()
@requires_permission("permisos:assign")
def revoke_permission_from_role_endpoint(role_id: int, permission_id: int):
    """
    Quita un permiso de un rol (baja lógica).
    Requiere permiso: permisos:assign
    
    Response 204:
        (Sin contenido)
    """
    try:
        current_user = get_jwt_identity()
        
        # Usar método existente del repository
        success = permission_repo.revoke_permission_from_role(
            role_id=role_id,
            permission_id=permission_id,
            user_id=current_user
        )
        
        if not success:
            return jsonify({
                "code": "REVOKE_FAILED",
                "message": "No se pudo revocar el permiso (puede que no esté asignado)"
            }), 404
        
        # Invalidar cache
        authorization_service.invalidate_cache()
        
        return "", 204
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al revocar permiso: {str(e)}"
        }), 500
