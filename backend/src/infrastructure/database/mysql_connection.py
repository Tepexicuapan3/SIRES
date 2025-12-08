#mysql_connection.py
import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DATABASE_HOST', '10.15.15.76'),
    'port': int(os.getenv('DATABASE_PORT', 3306)),
    'database': os.getenv('DATABASE_NAME', 'dbsisem'),
    'user': os.getenv('DATABASE_USER', 'sires'),
    'password': os.getenv('DATABASE_PASSWORD', '112233'),
}

def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Error as e:
        print(f"[DB] Error: {e}")
        return None

def close_db(connection, cursor=None):
    if cursor:
        cursor.close()
    if connection and connection.is_connected():
        connection.close() 