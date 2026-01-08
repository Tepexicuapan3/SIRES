"""
Users Routes - Endpoints para administración de usuarios

Responsabilidades:
- Crear usuarios (admin only)
- Listar usuarios (requiere permisos)
- Gestionar usuarios (CRUD básico)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from src.infrastructure.authorization.decorators import requires_permission
from src.use_cases.users.assign_roles_to_user import AssignRolesToUserUseCase
from src.use_cases.users.create_user_usecase import CreateUserUseCase
from src.use_cases.users.get_user_usecase import GetUserUseCase
from src.use_cases.users.list_users_usecase import ListUsersUseCase
from src.use_cases.users.revoke_role_from_user import RevokeRoleFromUserUseCase
from src.use_cases.users.set_primary_role import SetPrimaryRoleUseCase
from src.use_cases.users.toggle_user_status_usecase import \
    ToggleUserStatusUseCase
from src.use_cases.users.update_user_usecase import UpdateUserUseCase

users_bp = Blueprint("users", __name__)
create_user_usecase = CreateUserUseCase()
list_users_usecase = ListUsersUseCase()
get_user_usecase = GetUserUseCase()
update_user_usecase = UpdateUserUseCase()
toggle_status_usecase = ToggleUserStatusUseCase()
assign_roles_usecase = AssignRolesToUserUseCase()
set_primary_role_usecase = SetPrimaryRoleUseCase()
revoke_role_usecase = RevokeRoleFromUserUseCase()


# ============= CREATE USER =============
@users_bp.route("", methods=["POST"], strict_slashes=False)
@jwt_required()
@requires_permission("usuarios:create")
def create_user():
    """
    Crea un nuevo usuario en el sistema.
    Solo administradores.
    
    Body:
        {
            "usuario": "jperez",
            "expediente": "12345678",
            "nombre": "Juan",
            "paterno": "Pérez",
            "materno": "García",
            "curp": "PEGJ950101HDFRZN01",
            "correo": "jperez@metro.cdmx.gob.mx",
            "id_rol": 2
        }
    
    Response 201:
        {
            "message": "Usuario creado correctamente",
            "user": {
                "id_usuario": 123,
                "usuario": "jperez",
                "expediente": "12345678",
                "temp_password": "Ab3!xYz9Qw2@",
                "must_change_password": true,
                "rol_asignado": 2
            }
        }
    
    Errors:
        - 400 INVALID_REQUEST: Faltan campos requeridos
        - 409 USUARIO_EXISTS: El nombre de usuario ya existe
        - 409 EXPEDIENTE_EXISTS: El expediente ya está registrado
        - 500 SERVER_ERROR: Error interno
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validación de campos requeridos
        required_fields = ["usuario", "expediente", "nombre", "paterno", "materno", "curp", "correo", "id_rol"]
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": f"Campos requeridos faltantes: {', '.join(missing_fields)}"
            }), 400
        
        # Validación básica de formato
        if len(data["usuario"]) < 3 or len(data["usuario"]) > 20:
            return jsonify({
                "code": "VALIDATION_ERROR",
                "message": "El usuario debe tener entre 3 y 20 caracteres"
            }), 422
        
        if len(data["expediente"]) != 8 or not data["expediente"].isdigit():
            return jsonify({
                "code": "VALIDATION_ERROR",
                "message": "El expediente debe ser de 8 dígitos"
            }), 422
        
        if len(data["curp"]) != 18:
            return jsonify({
                "code": "VALIDATION_ERROR",
                "message": "El CURP debe tener 18 caracteres"
            }), 422
        
        # Ejecutar use case
        result, error = create_user_usecase.execute(
            usuario=data["usuario"],
            expediente=data["expediente"],
            nombre=data["nombre"],
            paterno=data["paterno"],
            materno=data["materno"],
            curp=data["curp"],
            correo=data["correo"],
            id_rol=data["id_rol"],
            created_by_user_id=current_user_id
        )
        
        if error:
            error_mapping = {
                "USUARIO_EXISTS": (409, "El nombre de usuario ya está registrado"),
                "EXPEDIENTE_EXISTS": (409, "El expediente ya está registrado"),
                "USER_CREATION_FAILED": (500, "No se pudo crear el usuario"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Usuario creado correctamente. La contraseña temporal debe ser entregada al usuario de forma segura.",
            "user": result
        }), 201
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al crear usuario: {str(e)}"
        }), 500


# ============= LIST USERS (requiere permiso usuarios:read) =============
@users_bp.route("", methods=["GET"], strict_slashes=False)
@jwt_required()
@requires_permission("usuarios:read")
def list_users():
    """
    Lista usuarios con paginación y filtros.
    Requiere permiso 'usuarios:read'.
    
    Query params:
        - page (int, default=1): Número de página
        - page_size (int, default=20): Registros por página
        - search (str, opcional): Búsqueda por usuario/nombre/expediente/CURP/correo
        - estado (str, opcional): 'A' (activo) o 'B' (baja)
        - rol_id (int, opcional): Filtrar por rol específico
    
    Response 200:
        {
            "items": [{ id_usuario, usuario, nombre, ... }],
            "page": 1,
            "page_size": 20,
            "total": 150
        }
    
    Errors:
        - 400 INVALID_REQUEST: Parámetros de paginación inválidos
        - 500 SERVER_ERROR: Error interno
    """
    try:
        # Obtener query params
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 20))
        search_query = request.args.get("search", "").strip()
        estado = request.args.get("estado", "").strip()
        rol_id_str = request.args.get("rol_id", "").strip()
        
        # Validación básica
        if page < 1:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "El número de página debe ser mayor a 0"
            }), 400
        
        if page_size < 1 or page_size > 200:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "El tamaño de página debe estar entre 1 y 200"
            }), 400
        
        if estado and estado not in ("A", "B"):
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "El estado debe ser 'A' (activo) o 'B' (baja)"
            }), 400
        
        # Construir filtros
        filters = {}
        if search_query:
            filters["search_query"] = search_query
        if estado:
            filters["estado"] = estado
        if rol_id_str:
            try:
                filters["rol_id"] = int(rol_id_str)
            except ValueError:
                return jsonify({
                    "code": "INVALID_REQUEST",
                    "message": "El rol_id debe ser un número entero"
                }), 400
        
        # Ejecutar use case
        result, error = list_users_usecase.execute(page, page_size, filters)
        
        if error:
            error_mapping = {
                "INVALID_PAGINATION": (400, "Parámetros de paginación inválidos"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify(result), 200
    
    except ValueError as e:
        return jsonify({
            "code": "INVALID_REQUEST",
            "message": f"Parámetros inválidos: {str(e)}"
        }), 400
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al listar usuarios: {str(e)}"
        }), 500


# ============= GET USER BY ID (requiere permiso usuarios:read) =============
@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
@requires_permission("usuarios:read")
def get_user(user_id: int):
    """
    Obtiene detalles completos de un usuario por su ID.
    Requiere permiso 'usuarios:read'.
    
    Path params:
        - user_id (int): ID del usuario
    
    Response 200:
        {
            "user": {
                "id_usuario": 123,
                "usuario": "jperez",
                "nombre": "Juan",
                "paterno": "Pérez",
                "materno": "García",
                "expediente": "12345678",
                "curp": "PEGJ950101HDFRZN01",
                "correo": "jperez@metro.cdmx.gob.mx",
                "img_perfil": null,
                "est_usuario": "A",
                "usr_alta": 1,
                "fch_alta": "2025-01-15 10:30:00",
                "usr_modf": null,
                "fch_modf": null,
                "terminos_acept": true,
                "cambiar_clave": false,
                "last_conexion": "2025-01-20 14:25:00",
                "ip_ultima": "10.15.15.100"
            },
            "roles": [
                {
                    "id_rol": 2,
                    "rol": "ROL_MEDICO",
                    "desc_rol": "Médico Residente",
                    "is_primary": true
                }
            ]
        }
    
    Errors:
        - 404 USER_NOT_FOUND: Usuario no existe
        - 500 SERVER_ERROR: Error interno
    """
    try:
        result, error = get_user_usecase.execute(user_id)
        
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        # Separar roles del resto de datos del usuario
        roles = result.pop("roles", [])
        
        return jsonify({
            "user": result,
            "roles": roles
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al obtener usuario: {str(e)}"
        }), 500


# ============= UPDATE USER (requiere permiso usuarios:update) =============
@users_bp.route("/<int:user_id>", methods=["PATCH"])
@jwt_required()
@requires_permission("usuarios:update")
def update_user(user_id: int):
    """
    Actualiza datos de perfil de un usuario.
    Requiere permiso 'usuarios:update'.
    
    Campos actualizables: nombre, paterno, materno, correo
    Campos NO actualizables: usuario, expediente, curp, clave (usar endpoints específicos)
    
    Path params:
        - user_id (int): ID del usuario a actualizar
    
    Body (todos opcionales, al menos uno requerido):
        {
            "nombre": "Juan",
            "paterno": "Pérez",
            "materno": "García",
            "correo": "jperez@metro.cdmx.gob.mx"
        }
    
    Response 200:
        {
            "message": "Usuario actualizado correctamente",
            "user": {
                "id_usuario": 123,
                "usuario": "jperez",
                "nombre": "Juan",
                "paterno": "Pérez",
                "materno": "García",
                "correo": "jperez@metro.cdmx.gob.mx",
                "usr_modf": 1,
                "fch_modf": "2025-01-20 15:30:00",
                ...
            }
        }
    
    Errors:
        - 400 NO_FIELDS_TO_UPDATE: No se enviaron campos para actualizar
        - 404 USER_NOT_FOUND: Usuario no existe
        - 409 EMAIL_DUPLICATE: El correo ya está en uso por otro usuario
        - 422 INVALID_EMAIL: Formato de correo inválido
        - 500 UPDATE_FAILED: Error al ejecutar la actualización
        - 500 SERVER_ERROR: Error interno
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        # Ejecutar use case
        result, error = update_user_usecase.execute(user_id, data, current_user_id)
        
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado"),
                "NO_FIELDS_TO_UPDATE": (400, "No se enviaron campos para actualizar"),
                "EMAIL_DUPLICATE": (409, "El correo ya está en uso por otro usuario"),
                "INVALID_EMAIL": (422, "Formato de correo inválido"),
                "UPDATE_FAILED": (500, "No se pudo actualizar el usuario"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Usuario actualizado correctamente",
            "user": result
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al actualizar usuario: {str(e)}"
        }), 500


# ============= DEACTIVATE USER =============
@users_bp.route("/<int:user_id>/deactivate", methods=["PATCH"])
@jwt_required()
@requires_permission("usuarios:update")
def deactivate_user(user_id: int):
    """Desactiva un usuario (est_usuario = 'B')"""
    try:
        current_user_id = int(get_jwt_identity())
        result, error = toggle_status_usecase.execute(user_id, activate=False, modified_by=current_user_id)
        
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado"),
                "TOGGLE_FAILED": (500, "No se pudo desactivar el usuario"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Usuario desactivado correctamente",
            "user": result
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al desactivar usuario: {str(e)}"
        }), 500


# ============= ACTIVATE USER =============
@users_bp.route("/<int:user_id>/activate", methods=["PATCH"])
@jwt_required()
@requires_permission("usuarios:update")
def activate_user(user_id: int):
    """Reactiva un usuario (est_usuario = 'A')"""
    try:
        current_user_id = int(get_jwt_identity())
        result, error = toggle_status_usecase.execute(user_id, activate=True, modified_by=current_user_id)
        
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado"),
                "TOGGLE_FAILED": (500, "No se pudo activar el usuario"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Usuario activado correctamente",
            "user": result
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al activar usuario: {str(e)}"
        }), 500


# ============= MULTI-ROL MANAGEMENT (FASE 3) =============

@users_bp.route("/<int:user_id>/roles", methods=["POST"])
@jwt_required()
@requires_permission("usuarios:update")
def assign_roles_to_user(user_id: int):
    """
    Asigna múltiples roles a un usuario.
    
    Body:
        {
            "role_ids": [1, 3, 5]
        }
    
    Response 200:
        {
            "message": "Roles asignados correctamente",
            "assigned_count": 2,
            "user_id": 45,
            "role_ids": [1, 3, 5]
        }
    
    Errors:
        - 400 INVALID_REQUEST: Faltan campos requeridos
        - 404 USER_NOT_FOUND: Usuario no existe
        - 404 ROLE_NOT_FOUND: Algún rol no existe
        - 400 EMPTY_ROLE_LIST: Lista de roles vacía
        - 500 SERVER_ERROR: Error interno
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validación de campos requeridos
        if not data or "role_ids" not in data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "El campo 'role_ids' es requerido"
            }), 400
        
        role_ids = data["role_ids"]
        
        # Validar que sea una lista
        if not isinstance(role_ids, list):
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "'role_ids' debe ser una lista de IDs"
            }), 400
        
        # Ejecutar use case
        result, error = assign_roles_usecase.execute(
            user_id=user_id,
            role_ids=role_ids,
            modified_by=current_user_id
        )
        
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado"),
                "EMPTY_ROLE_LIST": (400, "La lista de roles no puede estar vacía"),
                "ROLE_NOT_FOUND": (404, "Uno o más roles no existen"),
                "DB_CONNECTION_FAILED": (500, "Error de conexión a la base de datos"),
                "ROLE_ASSIGNMENT_FAILED": (500, "Error al asignar roles"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Roles asignados correctamente",
            **result
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al asignar roles: {str(e)}"
        }), 500


@users_bp.route("/<int:user_id>/roles/primary", methods=["PUT"])
@jwt_required()
@requires_permission("usuarios:update")
def set_primary_role(user_id: int):
    """
    Cambia el rol primario de un usuario.
    
    Body:
        {
            "role_id": 3
        }
    
    Response 200:
        {
            "message": "Rol primario actualizado correctamente",
            "user_id": 45,
            "role_id": 3
        }
    
    Errors:
        - 400 INVALID_REQUEST: Faltan campos requeridos
        - 404 USER_NOT_FOUND: Usuario no existe
        - 400 ROLE_NOT_ASSIGNED: El rol no está asignado al usuario
        - 400 ROLE_INACTIVE: El rol está revocado
        - 500 SERVER_ERROR: Error interno
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validación de campos requeridos
        if not data or "role_id" not in data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "El campo 'role_id' es requerido"
            }), 400
        
        role_id = data["role_id"]
        
        # Ejecutar use case
        result, error = set_primary_role_usecase.execute(
            user_id=user_id,
            role_id=role_id,
            modified_by=current_user_id
        )
        
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado"),
                "ROLE_NOT_ASSIGNED": (400, "El rol no está asignado al usuario"),
                "ROLE_INACTIVE": (400, "El rol está inactivo o revocado"),
                "DB_CONNECTION_FAILED": (500, "Error de conexión a la base de datos"),
                "SET_PRIMARY_FAILED": (500, "Error al cambiar rol primario"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Rol primario actualizado correctamente",
            **result
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al cambiar rol primario: {str(e)}"
        }), 500


@users_bp.route("/<int:user_id>/roles/<int:role_id>", methods=["DELETE"])
@jwt_required()
@requires_permission("usuarios:update")
def revoke_role_from_user(user_id: int, role_id: int):
    """
    Revoca un rol de un usuario.
    
    Response 200:
        {
            "message": "Rol revocado correctamente",
            "user_id": 45,
            "role_id": 3,
            "reassigned_primary": true
        }
    
    Errors:
        - 404 USER_NOT_FOUND: Usuario no existe
        - 400 CANNOT_REVOKE_LAST_ROLE: No se puede revocar el único rol
        - 400 ROLE_NOT_ASSIGNED: El rol no está asignado al usuario
        - 400 ROLE_ALREADY_REVOKED: El rol ya está revocado
        - 500 SERVER_ERROR: Error interno
    """
    try:
        current_user_id = int(get_jwt_identity())
        
        # Ejecutar use case
        result, error = revoke_role_usecase.execute(
            user_id=user_id,
            role_id=role_id,
            modified_by=current_user_id
        )
        
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado"),
                "CANNOT_REVOKE_LAST_ROLE": (400, "No se puede revocar el único rol del usuario"),
                "ROLE_NOT_ASSIGNED": (400, "El rol no está asignado al usuario"),
                "ROLE_ALREADY_REVOKED": (400, "El rol ya fue revocado anteriormente"),
                "DB_CONNECTION_FAILED": (500, "Error de conexión a la base de datos"),
                "REVOKE_ROLE_FAILED": (500, "Error al revocar rol"),
                "SERVER_ERROR": (500, "Error interno del servidor"),
            }
            status, message = error_mapping.get(error, (500, "Error desconocido"))
            return jsonify({"code": error, "message": message}), status
        
        return jsonify({
            "message": "Rol revocado correctamente",
            **result
        }), 200
    
    except Exception as e:
        return jsonify({
            "code": "SERVER_ERROR",
            "message": f"Error al revocar rol: {str(e)}"
        }), 500

