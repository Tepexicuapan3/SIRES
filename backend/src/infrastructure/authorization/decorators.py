"""
Permission Decorators - Protección de endpoints basada en permisos

Uso:
    @app.route("/api/v1/expedientes", methods=["POST"])
    @jwt_required()
    @requires_permission("expedientes:create")
    def create_expediente():
        ...

Principios:
- Decorator ejecuta DESPUÉS de @jwt_required() (necesita user_id del JWT)
- Devuelve 403 si falta permiso (no 401, porque SÍ está autenticado)
- No contiene lógica de negocio, solo validación
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from typing import List, Callable

from src.infrastructure.authorization.authorization_service import authorization_service


def requires_permission(permission: str):
    """
    Decorator que verifica si el usuario autenticado tiene un permiso específico.
    
    Args:
        permission: Código del permiso requerido (ej: "expedientes:delete")
        
    Ejemplo:
        @requires_permission("usuarios:assign_roles")
        def assign_role_to_user():
            ...
    
    Returns:
        403 si no tiene el permiso
        Ejecuta la función si tiene permiso o es admin
    """
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verificar que JWT esté presente (por si olvidaron @jwt_required())
            verify_jwt_in_request()
            
            # Obtener user_id del JWT
            user_id = get_jwt_identity()
            
            if not user_id:
                return jsonify({
                    "code": "UNAUTHORIZED",
                    "message": "Token inválido o usuario no identificado"
                }), 401
            
            # Verificar permiso
            if not authorization_service.has_permission(user_id, permission):
                return jsonify({
                    "code": "FORBIDDEN",
                    "message": f"No tenés permiso para realizar esta acción (requiere: {permission})"
                }), 403
            
            # Permiso concedido → ejecutar función
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator


def requires_any_permission(permissions: List[str]):
    """
    Decorator que verifica si el usuario tiene AL MENOS UNO de los permisos listados.
    
    Args:
        permissions: Lista de códigos de permisos (ej: ["expedientes:read", "expedientes:read_own"])
        
    Ejemplo:
        @requires_any_permission(["reportes:view_all", "reportes:view_department"])
        def get_report():
            ...
    
    Returns:
        403 si no tiene ninguno de los permisos
    """
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            if not user_id:
                return jsonify({
                    "code": "UNAUTHORIZED",
                    "message": "Token inválido o usuario no identificado"
                }), 401
            
            if not authorization_service.has_any_permission(user_id, permissions):
                return jsonify({
                    "code": "FORBIDDEN",
                    "message": f"No tenés ninguno de los permisos requeridos: {', '.join(permissions)}"
                }), 403
            
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator


def requires_all_permissions(permissions: List[str]):
    """
    Decorator que verifica si el usuario tiene TODOS los permisos listados.
    
    Args:
        permissions: Lista de códigos de permisos
        
    Ejemplo:
        @requires_all_permissions(["usuarios:create", "usuarios:assign_roles"])
        def create_admin_user():
            ...
    
    Returns:
        403 si falta alguno de los permisos
    """
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            if not user_id:
                return jsonify({
                    "code": "UNAUTHORIZED",
                    "message": "Token inválido o usuario no identificado"
                }), 401
            
            if not authorization_service.has_all_permissions(user_id, permissions):
                return jsonify({
                    "code": "FORBIDDEN",
                    "message": f"Necesitás todos estos permisos: {', '.join(permissions)}"
                }), 403
            
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator


def admin_required():
    """
    Decorator que verifica si el usuario es administrador.
    Útil para endpoints críticos que solo admins pueden ejecutar.
    
    Ejemplo:
        @admin_required()
        def delete_all_data():
            ...
    
    Returns:
        403 si no es administrador
    """
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            if not user_id:
                return jsonify({
                    "code": "UNAUTHORIZED",
                    "message": "Token inválido o usuario no identificado"
                }), 401
            
            if not authorization_service.is_admin(user_id):
                return jsonify({
                    "code": "FORBIDDEN",
                    "message": "Esta acción requiere privilegios de administrador"
                }), 403
            
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator
