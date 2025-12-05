"""# src/presentation/api/auth_routes.py
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
        return jsonify({"code": "SERVER_ERROR", "message": "Error interno del servidor"}), 500

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

    return jsonify(result), 200
