# src/presentation/api/auth_routes.py
# CREACION DE APIs PARA LA AUTENTICACION

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

#casos de uso para autenticacion
from src.use_cases.auth.login_usecase import LoginUseCase
from src.use_cases.auth.logout_usecase import LogoutUseCase
from src.use_cases.auth.request_reset_code_usecase import RequestResetCodeUseCase
from src.use_cases.auth.verify_reset_code_usecase import VerifyResetCodeUseCase
from src.use_cases.auth.reset_password_usecase import ResetPasswordUseCase
from src.use_cases.auth.complete_onboarding_usecase import CompleteOnboardingUseCase

auth_bp = Blueprint("auth", __name__)

#instancaias de los casos de uso utilizados
login_usecase = LoginUseCase()
logout_usecase = LogoutUseCase()
reset_code_usecase = RequestResetCodeUseCase()
verify_reset_usecase = VerifyResetCodeUseCase()
reset_password_usecase = ResetPasswordUseCase()
complete_onboarding_usecase = CompleteOnboardingUseCase()

#============= inicio de sesion =============
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() #obtiene el cuerpo de la petision en JSON

    #valida que existan los campos requeridos
    if not data or "usuario" not in data or "clave" not in data:
        return jsonify({"code": "INVALID_REQUEST", "message": "Usuario y contraseña son requeridos"}), 400

    usuario = data.get("usuario") #extrae el usuario
    clave = data.get("clave") #extrae a clave
    ip = request.headers.get("X-Forwarded-For", request.remote_addr) #btiene la ip dle cliente 

    result, error = login_usecase.execute(usuario, clave, ip) #ejecuta el caso de uso

    #manejo de errores y codigos HTTP
    if error:
        mapping = {
            "INVALID_CREDENTIALS": (401, "Usuario o contraseña incorrectos"),
            "USER_LOCKED": (423, "Usuario temporalmente bloqueado"),
            "USER_INACTIVE": (403, "Usuario inactivo"),
            "SERVER_ERROR": (500, "Error interno del servidor")
        }
        # status y mensaje correspondiente al error
        status, msg = mapping.get(error, (500, "Error desconocido"))
        return jsonify({"code": error, "message": msg}), status

    return jsonify(result), 200 #login exitoso con status

#============= cierre de sesion =============
@auth_bp.route("/logout", methods=["POST"])
def logout():
    try:
        #obtiene el header de la autorizacion
        auth_header = request.headers.get("Authorization")

        #valida que exista el token
        if not auth_header:
            return jsonify({"code": "TOKEN_REQUIRED", "message": "Token es requerido"}), 400

        token = auth_header.split(" ")[1] #extrae el token del header (bearer token)
        ip = request.headers.get("X-Forwarded-For", request.remote_addr) #obtiene la IP

        result, error = logout_usecase.execute(token, ip)  #ejecuta caso de uso de cerrar sesion

        #manejo de errores para el cierre de sesion
        if error:
            if error == "INVALID_TOKEN":
                return jsonify({"code": "INVALID_TOKEN", "message": "Token inválido"}), 401
            return jsonify({"code": error, "message": "Error en logout"}), 500

        return jsonify(result), 200 #respuesta y status exitoso

    except Exception as e:
        print("Error en logout route:", e) #imprime el error en consola
        return jsonify({"code": "SERVER_ERROR", "message": "Error interno del servidor"}), 500

#============= refresh code =============
@auth_bp.route("/request-reset-code", methods=["POST"])
def request_reset_code():
    try:
        data = request.get_json() #obtiene el cuerpo del request
        email = data.get("email") #obtiene el email

        if not email: #valida que el email exista
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "El email es requerido."
            }), 400 #en  caso de que no, se pide 

        result, status = reset_code_usecase.execute(email)
        return jsonify(result), status

    except Exception as e:
        print("Error in request-reset-code:", e)
        return jsonify({"code": "SERVER_ERROR", "message": "Error interno del servidor"}), 500
    
#============= verificar codigo =============
@auth_bp.route("/verify-reset-code", methods=["POST"])
def verify_reset_code():
    try:
        data = request.get_json()
        email = data.get("email")
        code = data.get("code")

        if not email or not code:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Email y código son requeridos."
            }), 400

        result, status = verify_reset_usecase.execute(email, code)
        return jsonify(result), status

    except Exception as e:
        print("Error in verify-reset-code:", e)
        return jsonify({"code": "SERVER_ERROR", "message": "Error interno del servidor"}), 500

#============= reset pass =============
@auth_bp.route("/reset-password", methods=["POST"])
@jwt_required()
def reset_password():
    """
    Restablece la contraseña del usuario.
    
    Requiere:
    - JWT valido con scope 'password_reset'
    - Body: { "new_password": "..." }
    
    Retorna:
    - LoginResponse completa con nuevos tokens (scope full_access)
    """
    try:
        # Extraer claims y user_id desde el JWT
        claims = get_jwt()
        user_identity = get_jwt_identity()

        # Validar que el token tenga el scope correcto
        if claims.get("scope") != "password_reset":
            return jsonify({
                "code": "INVALID_SCOPE",
                "message": "Token no autorizado para restablecer contrasena."
            }), 403

        # Asegurarnos de que el user_id sea un entero
        try:
            user_id = int(user_identity)
        except (ValueError, TypeError):
            return jsonify({
                "code": "INVALID_TOKEN", 
                "message": "Identidad de usuario invalida en el token."
            }), 401

        # Obtener datos del body
        data = request.get_json()
        
        if not data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Body de la peticion es requerido."
            }), 400
        
        new_password = data.get("new_password")

        if not new_password:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "La nueva contrasena es requerida."
            }), 400

        # Obtener IP del cliente
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)

        # Ejecutar caso de uso
        result, error = reset_password_usecase.execute(user_id, new_password, ip)
        
        # Manejo de errores
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado."),
                "PASSWORD_REQUIRED": (400, "La contrasena es requerida."),
                "PASSWORD_TOO_SHORT": (400, "La contrasena debe tener al menos 8 caracteres."),
                "PASSWORD_NO_UPPERCASE": (400, "La contrasena debe incluir al menos una letra mayuscula."),
                "PASSWORD_NO_NUMBER": (400, "La contrasena debe incluir al menos un numero."),
                "PASSWORD_NO_SPECIAL": (400, "La contrasena debe incluir al menos un caracter especial (@, #, $, etc.)."),
                "PASSWORD_UPDATE_FAILED": (500, "Error al actualizar la contrasena."),
            }
            status, msg = error_mapping.get(error, (500, "Error desconocido en el servidor."))
            return jsonify({"code": error, "message": msg}), status

        return jsonify(result), 200

    except Exception as e:
        print("Error in reset-password:", e)
        return jsonify({
            "code": "SERVER_ERROR",
            "message": "Error interno del servidor."
        }), 500


#============== completar onboarding ==============
@auth_bp.route("/complete-onboarding", methods=["POST"])
@jwt_required()
def complete_onboarding():
    """
    Completa el proceso de onboarding para usuarios nuevos.
    
    Requiere:
    - JWT valido con scope 'onboarding' o 'pre_auth_onboarding'
    - Body: { "new_password": "...", "terms_accepted": true }
    
    Retorna:
    - LoginResponse completa con nuevos tokens (scope full_access)
    """
    try:
        # Obtener usuario del token (NO del body - seguridad)
        claims = get_jwt()
        user_identity = get_jwt_identity()
        
        # Validar scope del token
        token_scope = claims.get("scope", "")
        if token_scope not in ["onboarding", "pre_auth_onboarding"]:
            return jsonify({
                "code": "INVALID_SCOPE",
                "message": "Token no autorizado para completar onboarding. Inicia sesion nuevamente."
            }), 403
        
        # Convertir user_identity a int
        try:
            user_id = int(user_identity)
        except (ValueError, TypeError):
            return jsonify({
                "code": "INVALID_TOKEN", 
                "message": "Identidad de usuario invalida en el token."
            }), 401
        
        # Obtener datos del body
        data = request.get_json()
        
        if not data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Body de la peticion es requerido."
            }), 400
        
        new_password = data.get("new_password")
        terms_accepted = data.get("terms_accepted", False)
        
        if not new_password:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "La nueva contrasena es requerida."
            }), 400
        
        # Obtener IP del cliente
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        
        # Ejecutar caso de uso
        result, error = complete_onboarding_usecase.execute(
            user_id=user_id,
            new_password=new_password,
            terms_accepted=terms_accepted,
            client_ip=ip
        )
        
        # Manejo de errores
        if error:
            error_mapping = {
                "TERMS_NOT_ACCEPTED": (400, "Debes aceptar los terminos y condiciones."),
                "USER_NOT_FOUND": (404, "Usuario no encontrado."),
                "ONBOARDING_NOT_REQUIRED": (400, "El usuario ya completo el proceso de activacion."),
                "PASSWORD_REQUIRED": (400, "La contrasena es requerida."),
                "PASSWORD_TOO_SHORT": (400, "La contrasena debe tener al menos 8 caracteres."),
                "PASSWORD_NO_UPPERCASE": (400, "La contrasena debe incluir al menos una letra mayuscula."),
                "PASSWORD_NO_NUMBER": (400, "La contrasena debe incluir al menos un numero."),
                "PASSWORD_NO_SPECIAL": (400, "La contrasena debe incluir al menos un caracter especial (@, #, $, etc.)."),
                "PASSWORD_UPDATE_FAILED": (500, "Error al actualizar la contrasena."),
                "ONBOARDING_UPDATE_FAILED": (500, "Error al completar el proceso de activacion."),
            }
            status, msg = error_mapping.get(error, (500, "Error desconocido en el servidor."))
            return jsonify({"code": error, "message": msg}), status
        
        return jsonify(result), 200
        
    except Exception as e:
        print("Error in complete-onboarding:", e)
        return jsonify({
            "code": "SERVER_ERROR",
            "message": "Error interno del servidor."
        }), 500









#====================================================
"""
from flask import Blueprint, request, jsonify
from src.use_cases.auth.login_usecase import LoginUseCase

auth_bp = Blueprint("auth", __name__)
usecase = LoginUseCase()

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data or "usuario" not in data or "clave" not in data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Usuario y contraseña son requeridos"
            }), 400

        usuario = data.get("usuario")
        clave = data.get("clave")
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)

        result, error = usecase.execute(usuario, clave, ip)

        if error:
            # mapear errores a status y messages
            if error == "INVALID_CREDENTIALS":
                return jsonify({"code": "INVALID_CREDENTIALS", "message": "Usuario o contraseña incorrectos"}), 401
            if error == "USER_LOCKED":
                return jsonify({"code": "USER_LOCKED", "message": "Usuario temporalmente bloqueado"}), 423
            if error == "USER_INACTIVE":
                return jsonify({"code": "USER_INACTIVE", "message": "Usuario inactivo"}), 403
            # fallback
            return jsonify({"code": error, "message": "Error en autenticación"}), 500

        # OK
        return jsonify(result), 200

    except Exception as e:
        print("Error in login route:", e)
        return jsonify({"code": "SERVER_ERROR", "message": "Error interno del servidor"}), 500"""

"""
from flask import Blueprint, request, jsonify
from src.use_cases.auth.login_usecase import LoginUseCase

auth_bp = Blueprint("auth", __name__)
usecase = LoginUseCase()

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or "usuario" not in data or "clave" not in data:
        return jsonify({"error": "INVALID_REQUEST", "message": "Faltan datos"}), 400

    username = data.get("usuario")
    password = data.get("clave")
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    result, error = usecase.execute(username, password, ip)

    if error:
        return jsonify({
            "error": error,
            "message": "Credenciales incorrectas" if error == "INVALID_CREDENTIALS"
                       else "Usuario inactivo"
        }), 401

    return jsonify(result), 200 



from flask import Blueprint, request, jsonify
from src.use_cases.auth.login_usecase import LoginUseCase

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("usuario")
    password = data.get("clave")

    ip = request.remote_addr
    usecase = LoginUseCase()

    result, error = usecase.execute(username, password, ip)

    if error:
        return jsonify({"error": error, "message": "Credenciales incorrectas"}), 401

    return jsonify(result), 200 """
