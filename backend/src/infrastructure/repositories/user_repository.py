# src/infrastructure/repositories/user_repository.py
from src.infrastructure.database.mysql_connection import get_db_connection, close_db

class UserRepository:

    def get_user_by_username(self, usuario):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_usuario, usuario, clave, nombre, paterno, materno, 
                       expediente, curp, img_perfil, correo, est_usuario
                FROM sy_usuarios
                WHERE usuario = %s
                LIMIT 1
            """, (usuario,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def get_user_by_email(self, email):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_usuario, usuario, clave, nombre, paterno, materno,
                       expediente, curp, img_perfil, correo, est_usuario
                FROM sy_usuarios
                WHERE correo = %s
                LIMIT 1
            """, (email,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)


    def get_user_roles(self, id_usuario):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT cr.rol
                FROM users_roles ur
                INNER JOIN cat_roles cr ON ur.id_rol = cr.id_rol
                WHERE ur.id_usuario = %s AND ur.est_usr_rol = 'A'
            """, (id_usuario,))
            roles = cursor.fetchall()
            return [r["rol"] for r in roles]
        finally:
            close_db(conn, cursor)
            

    def get_user_by_id(self, user_id: int):
        """
        Obtiene un usuario por su ID.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            dict | None: Datos del usuario o None si no existe
        """
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_usuario, usuario, nombre, paterno, materno,
                       expediente, curp, img_perfil, correo, est_usuario
                FROM sy_usuarios
                WHERE id_usuario = %s
                LIMIT 1
            """, (user_id,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def update_password_by_id(self, user_id, hashed_password):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE sy_usuarios
                SET clave = %s, usr_modf = 'system', fch_modf = NOW()
                WHERE id_usuario = %s
            """, (hashed_password, user_id))

            conn.commit()
            return cursor.rowcount > 0

        except Exception as e:
            print("Error updating password by ID:", e)
            return False

        finally:
            close_db(conn, cursor)

