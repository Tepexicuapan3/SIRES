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

    def create_user(
        self,
        usuario: str,
        clave: str,
        nombre: str,
        paterno: str,
        materno: str,
        expediente: str,
        curp: str,
        correo: str,
        created_by: int
    ) -> int | None:
        """
        Crea un nuevo usuario en sy_usuarios.
        
        Args:
            usuario: Nombre de usuario
            clave: Password hasheado
            nombre: Nombre(s)
            paterno: Apellido paterno
            materno: Apellido materno
            expediente: Número de expediente
            curp: CURP
            correo: Email
            created_by: ID del usuario que crea el registro
            
        Returns:
            ID del usuario creado o None si falla
        """
        conn = get_db_connection()
        if not conn:
            return None
        
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO sy_usuarios 
                (usuario, clave, nombre, paterno, materno, expediente, curp, correo, est_usuario, usr_alta, fch_alta)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'A', %s, NOW())
            """, (usuario, clave, nombre, paterno, materno, expediente, curp, correo, created_by))
            
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating user: {e}")
            conn.rollback()
            return None
        finally:
            close_db(conn, cursor)

    def assign_role_to_user(self, user_id: int, role_id: int, is_primary: bool, created_by: int) -> bool:
        """
        Asigna un rol a un usuario.
        
        Args:
            user_id: ID del usuario
            role_id: ID del rol
            is_primary: Si es el rol primario del usuario
            created_by: ID del usuario que crea la asignación
            
        Returns:
            True si se asignó correctamente
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = conn.cursor()
        try:
            is_primary_int = 1 if is_primary else 0
            
            cursor.execute("""
                INSERT INTO users_roles 
                (id_usuario, id_rol, is_primary, est_usr_rol, usr_alta, fch_alta)
                VALUES (%s, %s, %s, 'A', %s, NOW())
            """, (user_id, role_id, is_primary_int, created_by))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Error assigning role to user: {e}")
            conn.rollback()
            return False
        finally:
            close_db(conn, cursor)


