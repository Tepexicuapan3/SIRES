# src/presentation/api/auth_routes.py
# APIs de Autenticación con HttpOnly Cookies

from datetime import timedelta
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    jwt_required, 
    get_jwt, 
    get_jwt_identity,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
    create_access_token,
    create_refresh_token
)

# Rate Limiting
from src.infrastructure.rate_limiting import (
    rate_limit_login,
    rate_limit_otp,
    check_user_blocked,
    get_client_ip,
    rate_limiter
)

# Casos de uso
from src.use_cases.auth.login_usecase import LoginUseCase
from src.use_cases.auth.logout_usecase import LogoutUseCase
from src.use_cases.auth.request_reset_code_usecase import RequestResetCodeUseCase
from src.use_cases.auth.verify_reset_code_usecase import VerifyResetCodeUseCase
from src.use_cases.auth.reset_password_usecase import ResetPasswordUseCase
from src.use_cases.auth.complete_onboarding_usecase import CompleteOnboardingUseCase

auth_bp = Blueprint("auth", __name__)

# Instancias de casos de uso
login_usecase = LoginUseCase()
logout_usecase = LogoutUseCase()
reset_code_usecase = RequestResetCodeUseCase()
verify_reset_usecase = VerifyResetCodeUseCase()
reset_password_usecase = ResetPasswordUseCase()
complete_onboarding_usecase = CompleteOnboardingUseCase()


# ============= LOGIN =============
@auth_bp.route("/login", methods=["POST"])
@rate_limit_login  # Rate limiting por IP
def login():
    """
    Autentica al usuario y setea cookies HttpOnly con los tokens.
    
    Protección:
    - Rate limit: 10 requests/minuto por IP
    - Bloqueo IP: 15 fallos = 15min, 30 = 1h, 50 = 24h
    - Bloqueo Usuario: 5 fallos = 5min, 10 = 15min, 15 = 1h
    
    Body: { "usuario": "...", "clave": "..." }
    Response: { user, requires_onboarding } + Cookies (access_token, refresh_token)
    """
    data = request.get_json()

    if not data or "usuario" not in data or "clave" not in data:
        return jsonify({
            "code": "INVALID_REQUEST", 
            "message": "Usuario y contraseña son requeridos"
        }), 400

    usuario = data.get("usuario")
    clave = data.get("clave")
    ip = get_client_ip()

    # Verificar si el usuario está bloqueado (por intentos fallidos previos)
    blocked, response = check_user_blocked(usuario)
    if blocked:
        return response

    result, error = login_usecase.execute(usuario, clave, ip)

    if error:
        # Registrar intento fallido en Redis (solo para credenciales inválidas)
        if error in ["INVALID_CREDENTIALS", "USER_NOT_FOUND"]:
            rate_limiter.record_failed_attempt(ip, usuario)
        
        mapping = {
            "INVALID_CREDENTIALS": (401, "Usuario o contraseña incorrectos"),
            "USER_LOCKED": (423, "Usuario temporalmente bloqueado"),
            "USER_INACTIVE": (403, "Usuario inactivo"),
            "SERVER_ERROR": (500, "Error interno del servidor")
        }
        status, msg = mapping.get(error, (500, "Error desconocido"))
        return jsonify({"code": error, "message": msg}), status
    
    # Login exitoso - resetear intentos fallidos del usuario
    rate_limiter.reset_user_attempts(usuario)

    # Extraer datos del resultado
    user_data = result.get("user", {})
    requires_onboarding = result.get("requires_onboarding", False)
    
    # Generar tokens con Flask-JWT-Extended
    user_id = str(user_data.get("id_usuario"))
    username = user_data.get("usuario")
    roles = user_data.get("roles", [])  # Lista de códigos de roles
    
    if requires_onboarding:
        # Token limitado para onboarding (10 min, sin refresh)
        access_token = create_access_token(
            identity=user_id,
            additional_claims={
                "scope": "onboarding",
                "username": username,
                "roles": []  # Sin roles durante onboarding
            },
            expires_delta=timedelta(minutes=10)
        )
        refresh_token = None
    else:
        # Token completo con refresh
        access_token = create_access_token(
            identity=user_id,
            additional_claims={
                "scope": "full_access",
                "username": username,
                "roles": roles  # Incluir roles en JWT claims
            }
        )
        refresh_token = create_refresh_token(
            identity=user_id,
            additional_claims={
                "scope": "refresh",
                "username": username,
                "roles": roles  # Incluir roles en refresh token también
            }
        )
    
    # Crear respuesta con datos del usuario
    response = make_response(jsonify(result), 200)
    
    # Setear cookies HttpOnly
    set_access_cookies(response, access_token)
    if refresh_token:
        set_refresh_cookies(response, refresh_token)
    
    return response


# ============= LOGOUT =============
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Cierra la sesión eliminando las cookies de autenticación.
    Registra el evento en auditoría.
    """
    try:
        # Obtener user_id del JWT
        user_identity = get_jwt_identity()
        user_id = int(user_identity)
        
        # Obtener IP del cliente
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        
        # Ejecutar caso de uso de logout (registra auditoría)
        result, error = logout_usecase.execute(user_id, ip)
        
        if error:
            return jsonify({
                "code": error,
                "message": "Error al cerrar sesión"
            }), 500
        
        # Crear respuesta de éxito
        response = make_response(jsonify({
            "code": "LOGOUT_SUCCESS",
            "message": "Sesión cerrada correctamente"
        }), 200)
        
        # Eliminar todas las cookies JWT
        unset_jwt_cookies(response)
        
        return response

    except Exception as e:
        print("Error en logout route:", e)
        return jsonify({
            "code": "SERVER_ERROR", 
            "message": "Error interno del servidor"
        }), 500


# ============= REFRESH TOKEN =============
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)  # Requiere refresh token cookie
def refresh():
    """
    Renueva el access token usando el refresh token de la cookie.
    """
    try:
        # Obtener identidad del refresh token
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        # Crear nuevo access token
        additional_claims = {
            "scope": "full_access",
            "username": claims.get("username"),
        }
        
        new_access_token = create_access_token(
            identity=current_user_id,
            additional_claims=additional_claims
        )
        
        # Crear respuesta y setear nueva cookie
        response = make_response(jsonify({
            "code": "TOKEN_REFRESHED",
            "message": "Token renovado exitosamente"
        }), 200)
        
        set_access_cookies(response, new_access_token)
        
        return response

    except Exception as e:
        print("Error en refresh route:", e)
        return jsonify({
            "code": "SERVER_ERROR",
            "message": "Error al renovar token"
        }), 500


# ============= REQUEST RESET CODE =============
@auth_bp.route("/request-reset-code", methods=["POST"])
@rate_limit_otp  # Rate limiting para OTP
def request_reset_code():
    """
    Solicita código OTP para restablecer contraseña.
    
    Protección:
    - Rate limit para prevenir spam de emails
    - No revela si el email existe o no (siempre responde igual)
    """
    try:
        data = request.get_json()
        email = data.get("email")

        if not email:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "El email es requerido."
            }), 400

        result, status = reset_code_usecase.execute(email)
        return jsonify(result), status

    except Exception as e:
        print("Error in request-reset-code:", e)
        return jsonify({
            "code": "SERVER_ERROR", 
            "message": "Error interno del servidor"
        }), 500


# ============= VERIFY RESET CODE =============
@auth_bp.route("/verify-reset-code", methods=["POST"])
@rate_limit_otp  # Rate limiting para OTP
def verify_reset_code():
    """
    Verifica el código OTP y retorna un token temporal para reset.
    El token se setea en cookie para el siguiente paso.
    
    Protección:
    - Rate limit por IP
    - Máximo 3 intentos por código (manejado en OTPService)
    """
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
        
        # Si fue exitoso, el resultado contiene reset_token
        if status == 200 and "reset_token" in result:
            reset_token = result.pop("reset_token")
            
            # Crear respuesta y setear cookie con el reset token
            response = make_response(jsonify(result), 200)
            set_access_cookies(response, reset_token)
            
            return response
        
        return jsonify(result), status

    except Exception as e:
        print("Error in verify-reset-code:", e)
        return jsonify({
            "code": "SERVER_ERROR", 
            "message": "Error interno del servidor"
        }), 500


# ============= RESET PASSWORD =============
@auth_bp.route("/reset-password", methods=["POST"])
@jwt_required()
def reset_password():
    """
    Restablece la contraseña del usuario.
    
    Requiere: JWT cookie con scope 'password_reset'
    Body: { "new_password": "..." }
    Response: { user } + Cookies (access_token, refresh_token) con scope full_access
    """
    try:
        claims = get_jwt()
        user_identity = get_jwt_identity()

        if claims.get("scope") != "password_reset":
            return jsonify({
                "code": "INVALID_SCOPE",
                "message": "Token no autorizado para restablecer contraseña."
            }), 403

        try:
            user_id = int(user_identity)
        except (ValueError, TypeError):
            return jsonify({
                "code": "INVALID_TOKEN", 
                "message": "Identidad de usuario inválida en el token."
            }), 401

        data = request.get_json()
        
        if not data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Body de la petición es requerido."
            }), 400
        
        new_password = data.get("new_password")

        if not new_password:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "La nueva contraseña es requerida."
            }), 400

        ip = request.headers.get("X-Forwarded-For", request.remote_addr)

        result, error = reset_password_usecase.execute(user_id, new_password, ip)
        
        if error:
            error_mapping = {
                "USER_NOT_FOUND": (404, "Usuario no encontrado."),
                "USER_DETAILS_NOT_FOUND": (404, "Detalles del usuario no encontrados."),
                "PASSWORD_REQUIRED": (400, "La contraseña es requerida."),
                "PASSWORD_TOO_SHORT": (400, "La contraseña debe tener al menos 8 caracteres."),
                "PASSWORD_NO_UPPERCASE": (400, "La contraseña debe incluir al menos una letra mayúscula."),
                "PASSWORD_NO_NUMBER": (400, "La contraseña debe incluir al menos un número."),
                "PASSWORD_NO_SPECIAL": (400, "La contraseña debe incluir al menos un carácter especial."),
                "PASSWORD_UPDATE_FAILED": (500, "Error al actualizar la contraseña."),
            }
            status, msg = error_mapping.get(error, (500, "Error desconocido."))
            return jsonify({"code": error, "message": msg}), status

        # Generar nuevos tokens con Flask-JWT-Extended
        user_data = result.get("user", {})
        username = user_data.get("usuario")
        requires_onboarding = result.get("requires_onboarding", False)
        roles = user_data.get("roles", [])  # Obtener roles
        
        # Si el usuario no ha aceptado T&C, debe completar onboarding
        if requires_onboarding:
            # Token limitado para onboarding (10 min, sin refresh)
            access_token = create_access_token(
                identity=str(user_id),
                additional_claims={
                    "scope": "onboarding",
                    "username": username,
                    "roles": []  # Sin roles durante onboarding
                },
                expires_delta=timedelta(minutes=10)
            )
            refresh_token = None
        else:
            # Token completo con refresh para acceso inmediato
            access_token = create_access_token(
                identity=str(user_id),
                additional_claims={
                    "scope": "full_access",
                    "username": username,
                    "roles": roles  # Incluir roles
                }
            )
            refresh_token = create_refresh_token(
                identity=str(user_id),
                additional_claims={
                    "scope": "refresh",
                    "username": username,
                    "roles": roles  # Incluir roles
                }
            )
        
        # Crear respuesta con datos del usuario
        response = make_response(jsonify(result), 200)
        
        # Setear cookies según el flujo
        set_access_cookies(response, access_token)
        if refresh_token:
            set_refresh_cookies(response, refresh_token)
        
        return response

    except Exception as e:
        print("Error in reset-password:", e)
        return jsonify({
            "code": "SERVER_ERROR",
            "message": "Error interno del servidor."
        }), 500


# ============= COMPLETE ONBOARDING =============
@auth_bp.route("/complete-onboarding", methods=["POST"])
@jwt_required()
def complete_onboarding():
    """
    Completa el proceso de onboarding para usuarios nuevos.
    
    Requiere: JWT cookie con scope 'onboarding' o 'pre_auth_onboarding'
    Body: { "new_password": "...", "terms_accepted": true }
    Response: { user } + Cookies (access_token, refresh_token) con scope full_access
    """
    try:
        claims = get_jwt()
        user_identity = get_jwt_identity()
        
        token_scope = claims.get("scope", "")
        if token_scope not in ["onboarding", "pre_auth_onboarding"]:
            return jsonify({
                "code": "INVALID_SCOPE",
                "message": "Token no autorizado para completar onboarding."
            }), 403
        
        try:
            user_id = int(user_identity)
        except (ValueError, TypeError):
            return jsonify({
                "code": "INVALID_TOKEN", 
                "message": "Identidad de usuario inválida en el token."
            }), 401
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "Body de la petición es requerido."
            }), 400
        
        new_password = data.get("new_password")
        terms_accepted = data.get("terms_accepted", False)
        
        if not new_password:
            return jsonify({
                "code": "INVALID_REQUEST",
                "message": "La nueva contraseña es requerida."
            }), 400
        
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        
        result, error = complete_onboarding_usecase.execute(
            user_id=user_id,
            new_password=new_password,
            terms_accepted=terms_accepted,
            client_ip=ip
        )
        
        if error:
            error_mapping = {
                "TERMS_NOT_ACCEPTED": (400, "Debes aceptar los términos y condiciones."),
                "USER_NOT_FOUND": (404, "Usuario no encontrado."),
                "ONBOARDING_NOT_REQUIRED": (400, "El usuario ya completó el proceso de activación."),
                "PASSWORD_REQUIRED": (400, "La contraseña es requerida."),
                "PASSWORD_TOO_SHORT": (400, "La contraseña debe tener al menos 8 caracteres."),
                "PASSWORD_NO_UPPERCASE": (400, "La contraseña debe incluir al menos una letra mayúscula."),
                "PASSWORD_NO_NUMBER": (400, "La contraseña debe incluir al menos un número."),
                "PASSWORD_NO_SPECIAL": (400, "La contraseña debe incluir al menos un carácter especial."),
                "PASSWORD_UPDATE_FAILED": (500, "Error al actualizar la contraseña."),
                "ONBOARDING_UPDATE_FAILED": (500, "Error al completar el proceso de activación."),
            }
            status, msg = error_mapping.get(error, (500, "Error desconocido."))
            return jsonify({"code": error, "message": msg}), status
        
        # Generar nuevos tokens con Flask-JWT-Extended
        user_data = result.get("user", {})
        username = user_data.get("usuario")
        roles = user_data.get("roles", [])  # Obtener roles después de onboarding
        
        access_token = create_access_token(
            identity=str(user_id),
            additional_claims={
                "scope": "full_access",
                "username": username,
                "roles": roles  # Incluir roles en JWT claims
            }
        )
        refresh_token = create_refresh_token(
            identity=str(user_id),
            additional_claims={
                "scope": "refresh",
                "username": username,
                "roles": roles  # Incluir roles en refresh token
            }
        )
        
        # Crear respuesta con datos del usuario
        response = make_response(jsonify(result), 200)
        
        # Setear nuevas cookies con tokens full_access
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)
        
        return response
        
    except Exception as e:
        print("Error in complete-onboarding:", e)
        return jsonify({
            "code": "SERVER_ERROR",
            "message": "Error interno del servidor."
        }), 500


# ============= GET CURRENT USER =============
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Retorna los datos del usuario autenticado.
    Útil para verificar si la sesión es válida.
    """
    try:
        claims = get_jwt()
        user_identity = get_jwt_identity()
        
        # Aquí podrías hacer un query a la DB para obtener datos frescos
        # Por ahora retornamos lo que está en el token
        return jsonify({
            "id_usuario": user_identity,
            "username": claims.get("username"),
            "scope": claims.get("scope"),
            "authenticated": True
        }), 200
        
    except Exception as e:
        print("Error in get_current_user:", e)
        return jsonify({
            "code": "SERVER_ERROR",
            "message": "Error al obtener usuario."
        }), 500
