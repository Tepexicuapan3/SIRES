# src/presentation/api/auth_routes.py
from flask import Blueprint, request, jsonify
from src.use_cases.auth.login_usecase import LoginUseCase
from src.use_cases.auth.logout_usecase import LogoutUseCase

auth_bp = Blueprint("auth", __name__)
login_usecase = LoginUseCase()
logout_usecase = LogoutUseCase()

#============= inicio de sesion =============
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or "usuario" not in data or "clave" not in data:
        return jsonify({"code": "INVALID_REQUEST", "message": "Usuario y contraseña son requeridos"}), 400

    usuario = data.get("usuario")
    clave = data.get("clave")
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    result, error = login_usecase.execute(usuario, clave, ip)

    if error:
        mapping = {
            "INVALID_CREDENTIALS": (401, "Usuario o contraseña incorrectos"),
            "USER_LOCKED": (423, "Usuario temporalmente bloqueado"),
            "USER_INACTIVE": (403, "Usuario inactivo"),
            "SERVER_ERROR": (500, "Error interno del servidor")
        }
        status, msg = mapping.get(error, (500, "Error desconocido"))
        return jsonify({"code": error, "message": msg}), status

    return jsonify(result), 200

#============= cierre de sesion =============
@auth_bp.route("/logout", methods=["POST"])
def logout():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"code": "TOKEN_REQUIRED", "message": "Token es requerido"}), 400

        token = auth_header.split(" ")[1]
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)

        result, error = logout_usecase.execute(token, ip)

        if error:
            if error == "INVALID_TOKEN":
                return jsonify({"code": "INVALID_TOKEN", "message": "Token inválido"}), 401
            return jsonify({"code": error, "message": "Error en logout"}), 500

        return jsonify(result), 200

    except Exception as e:
        print("Error en logout route:", e)
        return jsonify({"code": "SERVER_ERROR", "message": "Error interno del servidor"}), 500


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
