from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os

def create_app():
    app = Flask(__name__)

    # ========== CONFIGURACIÓN JWT ==========
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY",
        "dev-secret-key-no-produccion"
    )
    
    # Tiempos de expiración
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 1800))  # 30 min
    )
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(
        seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 604800))  # 7 días
    )

    # ========== CONFIGURACIÓN COOKIES HttpOnly ==========
    # Ubicación del token: en cookies (no en headers Authorization)
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    
    # HttpOnly: JavaScript NO puede acceder a estas cookies (protección XSS)
    app.config["JWT_COOKIE_HTTPONLY"] = True
    
    # Secure: False para HTTP interno, True para HTTPS
    # En red interna del Metro sin HTTPS, debe ser False
    app.config["JWT_COOKIE_SECURE"] = os.getenv("JWT_COOKIE_SECURE", "false").lower() == "true"
    
    # SameSite: Protección CSRF básica
    # "Lax" permite navegación normal, bloquea requests cross-site POST
    app.config["JWT_COOKIE_SAMESITE"] = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
    
    # Nombres de las cookies
    app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token"
    app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token"
    
    # Paths de las cookies (limitar scope)
    app.config["JWT_ACCESS_COOKIE_PATH"] = "/"  # Accesible en toda la app
    app.config["JWT_REFRESH_COOKIE_PATH"] = "/api/v1/auth"  # Solo para auth endpoints
    
    # ========== PROTECCIÓN CSRF con Double-Submit Cookie Pattern ==========
    # CSRF Protection habilitado - Ahora compatible con Flask-JWT-Extended
    app.config["JWT_COOKIE_CSRF_PROTECT"] = True
    
    # El CSRF token se envía en una cookie separada (NO HttpOnly) para que JS pueda leerlo
    app.config["JWT_CSRF_IN_COOKIES"] = True
    app.config["JWT_ACCESS_CSRF_COOKIE_NAME"] = "csrf_access_token"
    app.config["JWT_REFRESH_CSRF_COOKIE_NAME"] = "csrf_refresh_token"
    
    # El frontend debe leer la cookie csrf_access_token y enviarla en este header
    app.config["JWT_ACCESS_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"
    app.config["JWT_REFRESH_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"
    
    # Solo verificar CSRF en métodos que modifican datos (no en GET)
    app.config["JWT_CSRF_METHODS"] = ["POST", "PUT", "PATCH", "DELETE"]
    
    # Inicializar JWT
    jwt = JWTManager(app)

    # ========== HANDLERS DE ERROR JWT ==========
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        print(f"DEBUG JWT - Token inválido: {error_string}")
        return jsonify({
            "code": "INVALID_TOKEN", 
            "message": f"Token inválido: {error_string}"
        }), 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error_string):
        print(f"DEBUG JWT - No autorizado: {error_string}")
        return jsonify({
            "code": "UNAUTHORIZED", 
            "message": "Sesión no encontrada. Por favor inicia sesión."
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"DEBUG JWT - Token expirado. Payload: {jwt_payload}")
        return jsonify({
            "code": "TOKEN_EXPIRED", 
            "message": "Tu sesión ha expirado."
        }), 401

    @jwt.token_verification_failed_loader
    def token_verification_failed_callback(jwt_header, jwt_payload):
        print(f"DEBUG JWT - Verificación fallida. Payload: {jwt_payload}")
        return jsonify({
            "code": "TOKEN_VERIFICATION_FAILED", 
            "message": "Error de verificación de sesión."
        }), 401
    
    @jwt.needs_fresh_token_loader
    def needs_fresh_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "code": "FRESH_TOKEN_REQUIRED",
            "message": "Se requiere una sesión reciente. Por favor inicia sesión nuevamente."
        }), 401

    # ========== CONFIGURACIÓN CORS ==========
    # IMPORTANTE: Para cookies cross-origin, NO se puede usar origins="*"
    # Debe especificarse el origen exacto del frontend
    allowed_origins = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    
    # Limpiar espacios en blanco
    allowed_origins = [origin.strip() for origin in allowed_origins]
    
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,  # CRÍTICO: Permite envío de cookies
        allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"],
        expose_headers=["X-CSRF-TOKEN"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # ========== REGISTRO DE BLUEPRINTS ==========
    from src.presentation.api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    # Health check endpoint
    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "ok", "service": "SIRES API"}), 200

    return app
