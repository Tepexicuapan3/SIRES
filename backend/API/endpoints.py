"""
API de Autenticación - Flask
Implementación completa de endpoints de autenticación según especificación
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import mysql.connector
from mysql.connector import Error
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
import base64
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta, timezone

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

# Configuración
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800))

# Configuración CORS
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
CORS(app, origins=allowed_origins, supports_credentials=True)

# Configuración de base de datos
DB_CONFIG = {
    'host': os.getenv('DATABASE_HOST', '10.15.15.76'),
    'port': int(os.getenv('DATABASE_PORT', 3306)),
    'database': os.getenv('DATABASE_NAME', 'dbsisem'),
    'user': os.getenv('DATABASE_USER', 'sires'),
    'password': os.getenv('DATABASE_PASSWORD', '112233'),
}

# ============================================================================
# UTILIDADES DE BASE DE DATOS
# ============================================================================

def get_db_connection():
    """Crear conexión a la base de datos"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None


def close_db_connection(connection, cursor=None):
    """Cerrar conexión y cursor de base de datos"""
    if cursor:
        cursor.close()
    if connection and connection.is_connected():
        connection.close()


# ============================================================================
# UTILIDADES DE JWT
# ============================================================================

def generate_access_token(user_data):
    """Generar access token JWT"""
    payload = {
        'user_id': user_data['id_usuario'],
        'username': user_data['usuario'],
        'roles': user_data['roles'],
        'expediente': user_data['expediente'],
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(seconds=app.config['JWT_ACCESS_TOKEN_EXPIRES']),
        'type': 'access'
    }
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')


def generate_refresh_token(user_data):
    """Generar refresh token JWT"""
    payload = {
        'user_id': user_data['id_usuario'],
        'username': user_data['usuario'],
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(seconds=app.config['JWT_REFRESH_TOKEN_EXPIRES']),
        'type': 'refresh'
    }
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')


def decode_token(token):
    """Decodificar y validar token JWT"""
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:   
        return None
    except jwt.InvalidTokenError:
        return None
    
#=============================================================================
# AES CBC
#=============================================================================
AES_SECRET_KEY = os.getenv("AES_SECRET_KEY")
if not AES_SECRET_KEY:
    AES_SECRET_KEY = os.urandom(32) # si no esat definida toma una temporal

#cifra el token con aes cbc y regresa e base 64
def encrypt_token_aes(token: str) -> str:
    if isinstance(token, bytes):
        token = token.decode()

    iv = os.urandom(16)

    padder = padding.PKCS7(128).padder()
    padded = padder.update(token.encode()) + padder.finalize()

    cipher = Cipher(algorithms.AES(AES_SECRET_KEY), modes.CBC(iv))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded) + encryptor.finalize()

    # Retornamos iv + ciphertext en base64 URL-safe
    return base64.urlsafe_b64encode(iv + ciphertext).decode()



# ============================================================================
# DECORADOR DE AUTENTICACIÓN
# ============================================================================

def token_required(f):
    """Decorador para proteger rutas que requieren autenticación"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Obtener token del header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({
                    'error': 'TOKEN_INVALID',
                    'message': 'Formato de token inválido'
                }), 401
        
        if not token:
            return jsonify({
                'error': 'TOKEN_MISSING',
                'message': 'Token de autenticación requerido'
            }), 401
        
        # Decodificar token
        payload = decode_token(token)
        
        if not payload:
            return jsonify({
                'error': 'TOKEN_EXPIRED',
                'message': 'Token expirado o inválido'
            }), 401
        
        # Verificar que sea access token
        if payload.get('type') != 'access':
            return jsonify({
                'error': 'TOKEN_INVALID',
                'message': 'Tipo de token inválido'
            }), 401
        
        # Pasar datos del usuario a la función
        return f(payload, *args, **kwargs)
    
    return decorated


# ============================================================================
# FUNCIONES DE AUDITORÍA
# ============================================================================

#tabla bit_accesos
def registrar_acceso(id_usuario, ip_ultima, conexion_act): #actualizada a los campos de bit_accesos, ya registra en la base
    """Registrar acceso en bit_accesos"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        query = """
            INSERT INTO bit_accesos 
            (id_usuario, ip_ultima, conexion_act, fecha_conexion)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (
            id_usuario,
            ip_ultima,
            conexion_act,
            datetime.now()
        ))
        connection.commit()
        return True
    except Error as e:
        print(f"Error registrando acceso: {e}")
        return False
    finally:
        close_db_connection(connection, cursor)



# ============================================================================
# FUNCIONES DE USUARIO
# ============================================================================

def get_user_by_username(usuario):
    """Obtener usuario por nombre de usuario"""
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            SELECT id_usuario, usuario, clave, nombre, paterno, materno,
                   expediente, curp, correo, img_perfil, est_usuario
            FROM sy_usuarios
            WHERE usuario = %s
        """
        cursor.execute(query, (usuario,))
        user = cursor.fetchone()
        return user
    except Error as e:
        print(f"Error obteniendo usuario: {e}")
        return None
    finally:
        close_db_connection(connection, cursor)


def get_user_roles(id_usuario):
    """Obtener roles del usuario"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            SELECT cr.rol
            FROM users_roles ur
            INNER JOIN cat_roles cr ON ur.id_rol = cr.id_rol
            WHERE ur.id_usuario = %s AND ur.est_usr_rol = 'A'
        """
        cursor.execute(query, (id_usuario,))
        roles = [row['rol'] for row in cursor.fetchall()]
        return roles
    except Error as e:
        print(f"Error obteniendo roles: {e}")
        return []
    finally:
        close_db_connection(connection, cursor)


def format_user_data(user, roles):
    """Formatear datos del usuario para respuesta"""
    nombre_completo = f"{user['nombre']} {user['paterno']} {user['materno']}".strip()
    
    return {
        'id_usuario': user['id_usuario'],
        'usuario': user['usuario'],
        'nombre': user['nombre'],
        'paterno': user['paterno'],
        'materno': user['materno'],
        'nombre_completo': nombre_completo,
        'expediente': user['expediente'],
        'curp': user['curp'],
        'correo': user['correo'],
        'img_perfil': user['img_perfil'],
        'est_usuario': user['est_usuario'],
        'roles': roles
    }


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """
    POST /api/v1/auth/login
    Autenticar usuario y generar tokens
    """
    try:
        data = request.get_json()
        
        # Validar datos de entrada
        if not data or 'usuario' not in data or 'clave' not in data:
            return jsonify({
                'error': 'INVALID_REQUEST',
                'message': 'Usuario y contraseña son requeridos'
            }), 400
        
        usuario = data['usuario'].strip()
        clave = data['clave']
        
        # Obtener información del request
        ip_ultima = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        # Buscar usuario
        user = get_user_by_username(usuario)
        
        if not user:
            registrar_acceso(None, ip_ultima, 'FAIL_USER_NOT_FOUND')
            return jsonify({
                'error': 'INVALID_CREDENTIALS',
                'message': 'Usuario o contraseña incorrectos'
            }), 401
        
        # Verificar estado del usuario
        if user['est_usuario'] != 'A':
            registrar_acceso(user['id_usuario'], ip_ultima, 'FAIL_USER_INACTIVE')
            return jsonify({
                'error': 'USER_INACTIVE',
                'message': 'Usuario inactivo. Contacte al administrador'
            }), 403
        
        # Verificar contraseña
        if not check_password_hash(user['clave'], clave):
        #if not bcrypt.checkpw(clave.encode('utf-8'), user['clave'].encode('utf-8')):
            registrar_acceso(user['id_usuario'], ip_ultima, 'FAIL_INVALID_PASSWORD')
            return jsonify({
                'error': 'INVALID_CREDENTIALS',
                'message': 'Usuario o contraseña incorrectos'
            }), 401
        
        # Obtener roles
        roles = get_user_roles(user['id_usuario'])
        
        # Formatear datos del usuario
        user_data = format_user_data(user, roles)
        
        # Generar tokens
        access_token = generate_access_token(user_data)
        refresh_token = generate_refresh_token(user_data)

        encrypted_token = encrypt_token_aes(access_token) #encripta el token con aes cbc
        redirect_url = f"http://localhost:5000/panel?auth={encrypted_token}" #se construye la url 
        
        # Registrar login exitoso
        registrar_acceso(user['id_usuario'], ip_ultima, 'EN SESIÓN')
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            'user': user_data ,
            'redirect_url': redirect_url
        }), 200
        
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({
            'error': 'INTERNAL_ERROR',
            'message': 'Error interno del servidor'
        }), 500


@app.route('/api/v1/auth/refresh', methods=['POST'])
def refresh():
    """
    POST /api/v1/auth/refresh
    Renovar access token usando refresh token
    """
    try:
        data = request.get_json()
        
        if not data or 'refresh_token' not in data:
            return jsonify({
                'error': 'INVALID_REQUEST',
                'message': 'Refresh token requerido'
            }), 400
        
        refresh_token = data['refresh_token']
        
        # Decodificar refresh token
        payload = decode_token(refresh_token)
        
        if not payload:
            return jsonify({
                'error': 'TOKEN_EXPIRED',
                'message': 'Refresh token expirado o inválido'
            }), 401
        
        # Verificar que sea refresh token
        if payload.get('type') != 'refresh':
            return jsonify({
                'error': 'TOKEN_INVALID',
                'message': 'Token inválido'
            }), 401
        
        # Obtener datos actualizados del usuario
        user = get_user_by_username(payload['username'])
        
        if not user or user['est_usuario'] != 'A':
            return jsonify({
                'error': 'USER_INACTIVE',
                'message': 'Usuario no disponible'
            }), 403
        
        # Obtener roles actualizados
        roles = get_user_roles(user['id_usuario'])
        user_data = format_user_data(user, roles)
        
        # Generar nuevo access token
        new_access_token = generate_access_token(user_data)
        
        return jsonify({
            'access_token': new_access_token,
            'token_type': 'Bearer',
            'expires_in': app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }), 200
        
    except Exception as e:
        print(f"Error en refresh: {e}")
        return jsonify({
            'error': 'INTERNAL_ERROR',
            'message': 'Error interno del servidor'
        }), 500


@app.route('/api/v1/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """
    POST /api/v1/auth/logout
    Cerrar sesión (invalidar tokens)
    """
    try:
        ip_ultima = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        # Registrar logout -> corregida a  los nuevos parametros de la funcion registrar_acceso
        registrar_acceso(
            current_user['user_id'],
            ip_ultima,
            'FUERA DE SESIÓN'
        )
        
        return jsonify({
            'message': 'Sesión cerrada correctamente'
        }), 200
        
    except Exception as e:
        print(f"Error en logout: {e}")
        return jsonify({
            'error': 'INTERNAL_ERROR',
            'message': 'Error interno del servidor'
        }), 500


@app.route('/api/v1/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    """
    GET /api/v1/auth/me
    Obtener datos del usuario autenticado
    """
    try:
        # Obtener datos actualizados del usuario
        user = get_user_by_username(current_user['username'])
        
        if not user:
            return jsonify({
                'error': 'USER_NOT_FOUND',
                'message': 'Usuario no encontrado'
            }), 404
        
        if user['est_usuario'] != 'A':
            return jsonify({
                'error': 'USER_INACTIVE',
                'message': 'Usuario inactivo'
            }), 403
        
        # Obtener roles
        roles = get_user_roles(user['id_usuario'])
        user_data = format_user_data(user, roles)
        
        return jsonify(user_data), 200
        
    except Exception as e:
        print(f"Error en get_me: {e}")
        return jsonify({
            'error': 'INTERNAL_ERROR',
            'message': 'Error interno del servidor'
        }), 500


@app.route('/api/v1/auth/verify', methods=['GET'])
@token_required
def verify(current_user):
    """
    GET /api/v1/auth/verify
    Verificar validez del token
    """
    try:
        # Calcular tiempo restante hasta expiración
        exp_timestamp = current_user['exp']
        now_timestamp = datetime.utcnow().timestamp()
        expires_in = int(exp_timestamp - now_timestamp)
        
        return jsonify({
            'valid': True,
            'user_id': current_user['user_id'],
            'expires_in': expires_in
        }), 200
        
    except Exception as e:
        print(f"Error en verify: {e}")
        return jsonify({
            'error': 'INTERNAL_ERROR',
            'message': 'Error interno del servidor'
        }), 500


# ============================================================================
# MANEJO DE ERRORES GLOBAL
# ============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'error': 'NOT_FOUND',
        'message': 'Endpoint no encontrado'
    }), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({
        'error': 'METHOD_NOT_ALLOWED',
        'message': 'Método no permitido'
    }), 405


@app.errorhandler(500)
def internal_error(e):
    return jsonify({
        'error': 'INTERNAL_ERROR',
        'message': 'Error interno del servidor'
    }), 500


# ============================================================================
# INICIO DE LA APLICACIÓN
# ============================================================================

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
