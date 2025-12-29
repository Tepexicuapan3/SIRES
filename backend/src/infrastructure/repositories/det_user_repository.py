# src/infrastructure/repositories/det_user_repository.py
from src.infrastructure.database.mysql_connection import get_db_connection, close_db
from datetime import datetime

class DetUserRepository:

    def get_det_by_userid(self, id_usuario):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_detusr, id_usuario, terminos_acept, last_conexion, act_conexion,
                       token, vida_token, cambiar_clave, ip_ultima, intentos_fallidos, fecha_bloqueo
                FROM det_usuarios
                WHERE id_usuario = %s
                LIMIT 1
            """, (id_usuario,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def increment_failed_attempts(self, id_detusr, current_attempts):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            new_attempts = (current_attempts or 0) + 1 #se quita ya que incrementa un intento
            cursor = conn.cursor()
            if new_attempts >= 7:
                cursor.execute("""
                    UPDATE det_usuarios
                    SET intentos_fallidos = %s, fecha_bloqueo = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
                    WHERE id_detusr = %s
                """, (new_attempts, id_detusr))
            else:
                cursor.execute("""
                    UPDATE det_usuarios
                    SET intentos_fallidos = %s
                    WHERE id_detusr = %s
                """, (new_attempts, id_detusr))
            conn.commit()
            return True
        finally:
            close_db(conn, cursor)

    def update_on_success_login(self, id_detusr, ip):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE det_usuarios
                SET last_conexion = act_conexion,
                    act_conexion = NOW(),
                    ip_ultima = %s,
                    intentos_fallidos = 0,
                    fecha_bloqueo = NULL
                WHERE id_detusr = %s
            """, (ip, id_detusr))
            conn.commit()
            return True
        finally:
            close_db(conn, cursor)

            
    def update_onboarding(self, id_usuario: int, terminos: str, cambiar_clave: str):
        conn = get_db_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE det_usuarios
                SET terminos_acept = %s,
                    cambiar_clave = %s,
                    act_conexion = NOW()
                WHERE id_usuario = %s
            """, (terminos, cambiar_clave, id_usuario))

            conn.commit()

            return cursor.rowcount > 0

        except Exception as e:
            print("Error in update_onboarding:", e)
            return False
        finally:
            close_db(conn)


    def disable_password_change(self, id_usuario):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE det_usuarios
                SET cambiar_clave = 'F',
                    act_conexion = NOW()
                WHERE id_usuario = %s
            """, (id_usuario,))

            conn.commit()
            return cursor.rowcount > 0
    
        except Exception as e:
            print("Error in disable_password_change:", e)
            return False
    
        finally:
            close_db(conn, cursor)


    def reset_lock_status(self, id_detusr):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE det_usuarios
                SET intentos_fallidos = 0,
                    fecha_bloqueo = NULL
                WHERE id_detusr = %s
            """, (id_detusr,))

            conn.commit()
            return cursor.rowcount > 0

        except Exception as e:
            print("Error resetting lock status:", e)
            return False

        finally:
            close_db(conn, cursor)


    def lock_user(self, id_detusr):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE det_usuarios
                SET fecha_bloqueo = NOW()
                WHERE id_detusr = %s
            """, (id_detusr,))

            conn.commit()
            return cursor.rowcount > 0

        except Exception as e:
            print("Error locking user:", e)
            return False

        finally:
            close_db(conn, cursor)

    def get_user_by_expediente(self, expediente: str):
        """
        Busca un usuario por su número de expediente.
        
        Args:
            expediente: Número de expediente
            
        Returns:
            dict | None: Datos del usuario o None si no existe
        """
        conn = get_db_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT su.id_usuario, su.usuario, su.expediente, su.nombre, su.paterno, su.materno
                FROM sy_usuarios su
                WHERE su.expediente = %s
                LIMIT 1
            """, (expediente,))
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)

    def create_det_user(self, id_usuario: int, expediente: str, must_change_password: bool, created_by: int) -> bool:
        """
        Crea el registro de detalles de usuario (det_usuarios).
        
        Args:
            id_usuario: ID del usuario en sy_usuarios
            expediente: Número de expediente
            must_change_password: Si el usuario debe cambiar su password
            created_by: ID del usuario que crea el registro
            
        Returns:
            True si se creó correctamente
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = conn.cursor()
        try:
            cambiar_clave = 'T' if must_change_password else 'F'
            
            cursor.execute("""
                INSERT INTO det_usuarios 
                (id_usuario, expediente, terminos_acept, cambiar_clave, intentos_fallidos, usr_alta, fch_alta)
                VALUES (%s, %s, 'F', %s, 0, %s, NOW())
            """, (id_usuario, expediente, cambiar_clave, created_by))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Error creating det_user: {e}")
            conn.rollback()
            return False
        finally:
            close_db(conn, cursor)


