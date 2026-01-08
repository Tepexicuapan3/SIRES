"""
Error Helpers - Centralización de mensajes de error para API responses

Este módulo centraliza:
1. Mapeo de códigos de error a mensajes en español
2. Mapeo de códigos de error a HTTP status codes
3. Helper para generar respuestas de error consistentes

Formato unificado de respuesta de error:
{
    "code": "ERROR_CODE",
    "message": "Mensaje descriptivo en español"
}
"""

from typing import Tuple

from flask import jsonify

# ============= ERROR MESSAGES BY DOMAIN =============

# Errores de Autenticación
AUTH_ERRORS = {
    "INVALID_CREDENTIALS": (401, "Usuario o contraseña incorrectos"),
    "USER_LOCKED": (423, "Usuario temporalmente bloqueado"),
    "USER_INACTIVE": (403, "Usuario inactivo"),
    "INVALID_SCOPE": (403, "Token no autorizado para esta operación"),
    "INVALID_TOKEN": (401, "Token inválido o expirado"),
    "TERMS_NOT_ACCEPTED": (400, "Debes aceptar los términos y condiciones"),
    "ONBOARDING_NOT_REQUIRED": (400, "El usuario ya completó el proceso de activación"),
}

# Errores de Usuarios
USER_ERRORS = {
    "USER_NOT_FOUND": (404, "Usuario no encontrado"),
    "USUARIO_EXISTS": (409, "El nombre de usuario ya está registrado"),
    "EXPEDIENTE_EXISTS": (409, "El expediente ya está registrado"),
    "EMAIL_DUPLICATE": (409, "El correo ya está en uso por otro usuario"),
    "INVALID_EMAIL": (422, "Formato de correo inválido"),
    "USER_CREATION_FAILED": (500, "No se pudo crear el usuario"),
    "USER_DETAILS_NOT_FOUND": (404, "Detalles del usuario no encontrados"),
    "UPDATE_FAILED": (500, "No se pudo actualizar el usuario"),
    "TOGGLE_FAILED": (500, "No se pudo cambiar el estado del usuario"),
}

# Errores de Roles
ROLE_ERRORS = {
    "ROLE_NOT_FOUND": (404, "Rol no encontrado"),
    "ROLE_NAME_REQUIRED": (400, "El nombre del rol es requerido"),
    "ROLE_NAME_INVALID": (400, "El nombre del rol contiene caracteres inválidos"),
    "ROLE_NAME_TOO_LONG": (400, "El nombre del rol no puede exceder 50 caracteres"),
    "ROLE_DESCRIPTION_REQUIRED": (400, "La descripción del rol es requerida"),
    "ROLE_DESCRIPTION_TOO_LONG": (400, "La descripción no puede exceder 200 caracteres"),
    "ROLE_NAME_DUPLICATE": (409, "Ya existe un rol con ese nombre"),
    "ROLE_SYSTEM_PROTECTED": (403, "Los roles del sistema no pueden ser modificados o eliminados"),
    "ROLE_HAS_USERS": (400, "No se puede eliminar un rol que tiene usuarios asignados"),
    "ROLE_NOT_ASSIGNED": (400, "El rol no está asignado al usuario"),
    "ROLE_INACTIVE": (400, "El rol está inactivo o revocado"),
    "ROLE_ALREADY_REVOKED": (400, "El rol ya fue revocado anteriormente"),
    "CANNOT_REVOKE_LAST_ROLE": (400, "No se puede revocar el único rol del usuario"),
    "EMPTY_ROLE_LIST": (400, "La lista de roles no puede estar vacía"),
    "ROLE_ASSIGNMENT_FAILED": (500, "Error al asignar roles"),
    "SET_PRIMARY_FAILED": (500, "Error al cambiar rol primario"),
    "REVOKE_ROLE_FAILED": (500, "Error al revocar rol"),
    "CHANGE_FAILED": (500, "No se pudo cambiar el rol"),
    "SAME_ROLE": (409, "El usuario ya tiene ese rol como primario"),
    "INVALID_PRIORITY": (400, "La prioridad debe ser un número positivo"),
    "INVALID_LANDING_ROUTE": (400, "La ruta debe comenzar con /"),
}

# Errores de Permisos
PERMISSION_ERRORS = {
    "PERMISSION_NOT_FOUND": (404, "Permiso no encontrado"),
    "PERMISSION_CODE_REQUIRED": (400, "Código de permiso requerido"),
    "PERMISSION_CODE_INVALID": (400, "Formato de código inválido (debe ser resource:action)"),
    "PERMISSION_CODE_TOO_LONG": (400, "Código muy largo (máximo 100 caracteres)"),
    "PERMISSION_RESOURCE_REQUIRED": (400, "Resource requerido"),
    "PERMISSION_ACTION_REQUIRED": (400, "Action requerido"),
    "PERMISSION_CODE_MISMATCH": (400, "Código debe ser resource:action"),
    "PERMISSION_CODE_EXISTS": (409, "Ya existe un permiso con ese código"),
    "PERMISSION_DESCRIPTION_TOO_LONG": (400, "Descripción muy larga (máximo 255 caracteres)"),
    "PERMISSION_CATEGORY_TOO_LONG": (400, "Categoría muy larga (máximo 50 caracteres)"),
    "PERMISSION_SYSTEM_PROTECTED": (403, "No se pueden modificar permisos del sistema"),
    "PERMISSION_IN_USE": (400, "Permiso asignado a roles, no se puede eliminar"),
    "INVALID_PERMISSIONS": (400, "Uno o más permisos no existen"),
    "EMPTY_PERMISSION_LIST": (400, "La lista de permisos no puede estar vacía"),
    "ASSIGNMENT_FAILED": (500, "No se pudo asignar el permiso al rol"),
    "REVOKE_FAILED": (404, "No se pudo revocar el permiso"),
    "INVALID_EFFECT": (400, "Effect debe ser ALLOW o DENY"),
    "INVALID_EXPIRATION_DATE": (400, "Formato de fecha de expiración inválido"),
    "OVERRIDE_NOT_FOUND": (404, "Override de permiso no encontrado"),
    "OVERRIDE_ALREADY_DELETED": (400, "El override ya fue eliminado anteriormente"),
    "OVERRIDE_CREATION_FAILED": (500, "Error al crear override de permiso"),
    "OVERRIDE_DELETION_FAILED": (500, "Error al eliminar override de permiso"),
}

# Errores de Validación
VALIDATION_ERRORS = {
    "INVALID_REQUEST": (400, "Solicitud inválida"),
    "MISSING_REQUIRED_FIELDS": (400, "Campos requeridos faltantes"),
    "VALIDATION_ERROR": (422, "Error de validación"),
    "NO_FIELDS_TO_UPDATE": (400, "No se proporcionó ningún campo para actualizar"),
    "INVALID_PAGINATION": (400, "Parámetros de paginación inválidos"),
}

# Errores de Password
PASSWORD_ERRORS = {
    "PASSWORD_REQUIRED": (400, "La contraseña es requerida"),
    "PASSWORD_TOO_SHORT": (400, "La contraseña debe tener al menos 8 caracteres"),
    "PASSWORD_NO_UPPERCASE": (400, "La contraseña debe incluir al menos una letra mayúscula"),
    "PASSWORD_NO_NUMBER": (400, "La contraseña debe incluir al menos un número"),
    "PASSWORD_NO_SPECIAL": (400, "La contraseña debe incluir al menos un carácter especial"),
    "PASSWORD_UPDATE_FAILED": (500, "Error al actualizar la contraseña"),
    "ONBOARDING_UPDATE_FAILED": (500, "Error al completar el proceso de activación"),
}

# Errores de Sistema/Infraestructura
SYSTEM_ERRORS = {
    "SERVER_ERROR": (500, "Error interno del servidor"),
    "DB_CONNECTION_FAILED": (500, "Error de conexión a la base de datos"),
    "DATABASE_ERROR": (500, "Error de base de datos"),
    "NOT_FOUND": (404, "Recurso no encontrado"),
}

# Consolidar todos los errores en un solo diccionario
ALL_ERRORS = {
    **AUTH_ERRORS,
    **USER_ERRORS,
    **ROLE_ERRORS,
    **PERMISSION_ERRORS,
    **VALIDATION_ERRORS,
    **PASSWORD_ERRORS,
    **SYSTEM_ERRORS,
}


def get_error_details(error_code: str) -> Tuple[int, str]:
    """
    Obtiene el status code y mensaje para un código de error.
    
    Args:
        error_code: Código de error (ej: "USER_NOT_FOUND")
        
    Returns:
        Tupla (status_code, message)
        Si el código no existe, retorna (500, error_code)
    """
    # Manejar errores de BD que vienen con prefijo
    if error_code and error_code.startswith("DATABASE_ERROR:"):
        return 500, "Error de base de datos"
    
    return ALL_ERRORS.get(error_code, (500, error_code))


def error_response(error_code: str, custom_message: str = None):
    """
    Genera una respuesta de error JSON consistente.
    
    Args:
        error_code: Código de error
        custom_message: Mensaje personalizado (opcional, override del default)
        
    Returns:
        Tupla (response, status_code) lista para retornar en Flask
        
    Ejemplo:
        return error_response("USER_NOT_FOUND")
        # Retorna: (jsonify({"code": "USER_NOT_FOUND", "message": "Usuario no encontrado"}), 404)
    """
    status, message = get_error_details(error_code)
    
    if custom_message:
        message = custom_message
    
    return jsonify({
        "code": error_code,
        "message": message
    }), status


def get_error_message(error_code: str) -> str:
    """
    Obtiene solo el mensaje de error (sin status code).
    Útil para cuando ya tienes el status code y solo necesitas el mensaje.
    
    Args:
        error_code: Código de error
        
    Returns:
        Mensaje de error en español
    """
    _, message = get_error_details(error_code)
    return message
