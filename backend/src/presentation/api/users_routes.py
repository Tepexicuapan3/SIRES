"""
Users Routes - Endpoints para administración de usuarios

Responsabilidades:
- Crear usuarios (admin only)
- Listar usuarios (requiere permisos)
- Gestionar usuarios (CRUD básico)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from src.infrastructure.authorization.decorators import admin_required, requires_permission
from src.use_cases.users.create_user_usecase import CreateUserUseCase

users_bp = Blueprint("users", __name__)
create_user_usecase = CreateUserUseCase()


# ============= CREATE USER (Admin only) =============
@users_bp.route("", methods=["POST"], strict_slashes=False)
@jwt_required()
@admin_required()
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
