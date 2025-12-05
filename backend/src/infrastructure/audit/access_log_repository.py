from src.infrastructure.database.mysql_connection import get_db_connection, close_db
from datetime import datetime


class AccessLogRepository:

    def registrar_acceso(self, id_usuario, ip, conexion_act):
        conn = get_db_connection()
        if not conn:
            return False

        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO bit_accesos
                (id_usuario, ip_ultima, conexion_act, fecha_conexion)
                VALUES (%s, %s, %s, %s)
            """, (id_usuario, ip, conexion_act, datetime.now()))
            conn.commit()
            return True
        finally:
            close_db(conn, cursor)
            #close_db(conn, cursor)
