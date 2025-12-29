#src\infrastructure\database\mysql_connection.py
import os
import mysql.connector #conector de MySQL
from mysql.connector import Error #errores y exepciones de MySQL
from dotenv import load_dotenv #para cargar variables de .env

load_dotenv() #carga las variables de .env

#configuracion de la base de datos
# IMPORTANTE: Estas variables DEBEN estar definidas en backend/.env
# Si falta alguna, la aplicación fallará explícitamente (mejor que valores hardcodeados)
DB_CONFIG = {
    'host': os.getenv('DATABASE_HOST'),
    'port': int(os.getenv('DATABASE_PORT', 3306)),
    'database': os.getenv('DATABASE_NAME'),
    'user': os.getenv('DATABASE_USER'),
    'password': os.getenv('DATABASE_PASSWORD'),
}

# Validar que las variables críticas estén configuradas
_required_vars = ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD']
_missing_vars = [var for var in _required_vars if not os.getenv(var)]

if _missing_vars:
    raise RuntimeError(
        f"[DB CONFIG ERROR] Faltan variables de entorno requeridas en backend/.env: {', '.join(_missing_vars)}\n"
        f"Revisá backend/.env.example para ver la configuración correcta."
    )

#funcion para obtener la conexion en la base de datos
def get_db_connection():
    try:
        #intenta establecer la conexion con la configuracion definida
        return mysql.connector.connect(**DB_CONFIG)
    except Error as e:
        print(f"[DB] Error: {e}") #imprime el error en la consola
        return None #none para indicar que no se pudo conectar

#funcion para cerrar la conexion en la base de datos
def close_db(connection, cursor=None):
    if cursor:
        cursor.close() #si existe un cursor activo se cierra
    if connection and connection.is_connected():
        connection.close()  #si la conexion existe y sigue activa se cierra