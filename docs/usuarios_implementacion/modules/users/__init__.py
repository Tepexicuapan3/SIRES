# app/users/__init__.py
from flask import Flask
#from app.modules.users import users_bp, auth_bp  # Asegúrate de que la ruta sea correcta

def create_app(config_class='config.Config'):
    app = Flask(__name__)
    app.config.from_object(config_class)

    return app

