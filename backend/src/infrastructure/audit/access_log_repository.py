# src/infrastructure/audit/access_log_repository.py
from src.infrastructure.database.mysql_connection import get_db_connection, close_db # obtener y cerrar conexion
from datetime import datetime #registrar fecha y hora 

class AccessLogRepository:

    #se registran los accesos en la tabla bit_accesos
    def registrar_acceso(self, id_usuario, ip, conexion_act):
        """
        inserta los siguientes parametros
            -id del usuario que se conecta
            -IP desde la que se conecta
            -estado de la conexion
        """
        conn = get_db_connection() #se obtiene la conexion
        if not conn:
            return False #false en caso que no se pueda obtener

        try:
            cursor = conn.cursor() 
            # ejecuta una consulta INSERT en la tabla 
            cursor.execute("""
                INSERT INTO bit_accesos (id_usuario, ip_ultima, conexion_act, fecha_conexion)
                VALUES (%s, %s, %s, %s)
            """, (id_usuario, ip, conexion_act, datetime.now()))
            conn.commit()  # commit para asegurar los insert
            return True
        finally:
            close_db(conn, cursor) #cierra la conexion 
