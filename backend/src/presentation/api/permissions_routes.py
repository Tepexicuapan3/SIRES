"""
Permissions Routes - Endpoints para administración de permisos (ejemplo de uso)

Este blueprint demuestra cómo usar el sistema RBAC 2.0 con decorators.
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

permissions_bp = Blueprint("permissions", __name__)
permission_repo = PermissionRepository()


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
