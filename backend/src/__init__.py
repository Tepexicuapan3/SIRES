from flask import Flask
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
    JWTManager(app)

    # habilitar CORS
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # cargar rutas
    from src.presentation.api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    return app
