# app/models/users.py
from app.extensions import db  # db debe estar inicializado en extensions.py
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class SyUsuarios(db.Model, UserMixin):
    __tablename__ = 'sy_usuarios'

    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario = db.Column(db.String(20, collation='utf8mb4_0900_ai_ci'), default=None)
    clave = db.Column(db.String(300, collation='utf8mb4_0900_ai_ci'), default=None)
    nombre = db.Column(db.String(45, collation='utf8mb4_0900_ai_ci'), default=None)
    paterno = db.Column(db.String(45, collation='utf8mb4_0900_ai_ci'), default=None)
    materno = db.Column(db.String(45, collation='utf8mb4_0900_ai_ci'), default=None)
    expediente = db.Column(db.String(8, collation='utf8mb4_0900_ai_ci'), default=None)
    curp = db.Column(db.String(45, collation='utf8mb4_0900_ai_ci'), default=None)
    img_perfil = db.Column(db.String(100, collation='utf8mb4_0900_ai_ci'), default=None)
    correo = db.Column(db.String(100, collation='utf8mb4_0900_ai_ci'), default=None)
    est_usuario = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    _table_args_ = (
        db.UniqueConstraint('usuario', name='usuario_UNIQUE'),
        db.UniqueConstraint('clave', name='clave_UNIQUE'),
        db.UniqueConstraint('expediente', name='expediente_UNIQUE'),
        db.UniqueConstraint('curp', name='curp_UNIQUE'),
        db.UniqueConstraint('correo', name='correo_UNIQUE'),
        )
    
    def is_active(self):
        return True
    
    def get_id(self):
        return str(self.id_usuario) 

    @property
    def password(self):
        raise AttributeError('La contraseña no es un atributo leíble')

    @password.setter
    def password(self, password):
        self.clave = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.clave, password)

    def is_authenticated(self):
        return True

    """def is_active(self):
        # You can implement your own logic for determining if the user is active
        return True"""

    def is_anonymous(self):
        return False

    """def get_id(self):
        return str(self.id)  # Assuming your user ID is an integer, convert it to a string"""

    # Crear una representación de cadena
    def __repr__(self):
        #return '<Usuario %r>' % self.usuario
        return f'<Usuario {self.usuario!r}>'
    

class DetUsuarios(db.Model):
    __tablename__ = 'det_usuarios'

    id_detusr = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, nullable=False, default=None)
    terminos_acept = db.Column(db.String(1), nullable=False, default=None)
    last_conexion = db.Column(db.DateTime, nullable=False, default=None)
    act_conexion = db.Column(db.DateTime, nullable=False, default=None)
    token = db.Column(db.String(300), nullable=True, default=None)
    vida_token = db.Column(db.DateTime, nullable=True, default=None)
    cambiar_clave = db.Column(db.String(1), nullable=False, default=None)
    ip_ultima = db.Column(db.String(45), nullable=True, default=None)


class AdminSubmenus(db.Model):
    __tablename__ = 'admin_submenus'

    id_adminsubmenu = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_submenu = db.Column(db.Integer, nullable=False, default=None)
    submenu = db.Column(db.String(50), nullable=False, default=None)
    id_rol = db.Column(db.Integer, nullable=False, default=None)
    tp_rol = db.Column(db.String(50), nullable=False, unique=True, default=None)
    est_adminsubmenu = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), nullable=False, default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

'''class bitacora(db.Model):
__tablename__ = 'bitacora_users'

    id_detusr = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, nullable=False, default=None)
    terminos_acept = db.Column(db.String(1), nullable=False, default=None)
    last_conexion = db.Column(db.DateTime, nullable=False, default=None)
    act_conexion = db.Column(db.DateTime, nullable=False, default=None)
    token = db.Column(db.String(8), nullable=True, default=None)
    vida_token = db.Column(db.DateTime, nullable=True, default=None)
    cambiar_clave = db.Column(db.String(1), nullable=False, default=None)
    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario = db.Column(db.String(20, collation='utf8mb4_0900_ai_ci'), default=None)
    clave = db.Column(db.String(300, collation='utf8mb4_0900_ai_ci'), default=None)
    nombre = db.Column(db.String(45, collation='utf8mb4_0900_ai_ci'), default=None)
    paterno = db.Column(db.String(45, collation='utf8mb4_0900_ai_ci'), default=None)
    materno = db.Column(db.String(45, collation='utf8mb4_0900_ai_ci'), default=None)
    expediente = db.Column(db.String(8, collation='utf8mb4_0900_ai_ci'), default=None)
    curp = db.Column(db.String(45, collation='utf8mb4_0900_ai_ci'), default=None)
    img_perfil = db.Column(db.String(100, collation='utf8mb4_0900_ai_ci'), default=None)
    correo = db.Column(db.String(100, collation='utf8mb4_0900_ai_ci'), default=None)
    est_usuario = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

'''
class BitAccesos(db.Model):
    __tablename__ = 'bit_accesos'

    id_acceso = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, nullable=False)
    ip_ultima = db.Column(db.String(45), nullable=False)
    conexion_act = db.Column(db.String(50), nullable=False)
    fecha_conexion = db.Column(db.DateTime, nullable=False)


def get_id(self):
        return str(self.id)  # Flask-Login requiere que el ID sea una cadena de texto