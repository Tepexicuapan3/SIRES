#src\infrastructure\database\mysql_connection.py
import os
import mysql.connector #conector de MySQL
from mysql.connector import Error #errores y exepciones de MySQL
from dotenv import load_dotenv #para cargar variables de .env

load_dotenv() #carga las variables de .env

#configuracion de la base de datos
DB_CONFIG = {
    'host': os.getenv('DATABASE_HOST', '10.15.15.76'),
    'port': int(os.getenv('DATABASE_PORT', 3306)),
    'database': os.getenv('DATABASE_NAME', 'dbsisem'),
    'user': os.getenv('DATABASE_USER', 'sires'),
    'password': os.getenv('DATABASE_PASSWORD', '112233'),
}

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