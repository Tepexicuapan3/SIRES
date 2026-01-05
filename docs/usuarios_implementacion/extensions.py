# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Instancias de las extensiones

db = SQLAlchemy()
mail = Mail()
login_manager = LoginManager()
migrate = Migrate()
# Limiter configurado correctamente
limiter = Limiter(get_remote_address, default_limits=["100 per minute", "500 per minute"], storage_uri="memory://")










