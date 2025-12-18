from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

def create_app():
    app = Flask(__name__)

    # configuracion JWT 
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY",
        "dev-secret-key-no-produccion"
    )

    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 1800  # 30 minutos

    # inicializar JWT
    jwt = JWTManager(app)

    # ========== HANDLERS DE ERROR JWT ==========
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        print(f"DEBUG JWT - Token inválido: {error_string}")
        return jsonify({"code": "INVALID_TOKEN", "message": f"Token inválido: {error_string}"}), 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error_string):
        print(f"DEBUG JWT - No autorizado: {error_string}")
        return jsonify({"code": "UNAUTHORIZED", "message": f"Falta token: {error_string}"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"DEBUG JWT - Token expirado. Header: {jwt_header}, Payload: {jwt_payload}")
        return jsonify({"code": "TOKEN_EXPIRED", "message": "El token ha expirado"}), 401

    @jwt.token_verification_failed_loader
    def token_verification_failed_callback(jwt_header, jwt_payload):
        print(f"DEBUG JWT - Verificación fallida. Header: {jwt_header}, Payload: {jwt_payload}")
        return jsonify({"code": "TOKEN_VERIFICATION_FAILED", "message": "Verificación de token fallida"}), 401

    # habilitar CORS
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # cargar rutas
    from src.presentation.api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    return app
