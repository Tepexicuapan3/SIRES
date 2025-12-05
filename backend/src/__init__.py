from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # habilitar CORS
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # cargar rutas
    from src.presentation.api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    return app
