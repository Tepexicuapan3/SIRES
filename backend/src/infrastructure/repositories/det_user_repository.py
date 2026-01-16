# src/infrastructure/repositories/det_user_repository.py
import logging
from datetime import datetime

from src.infrastructure.database.mysql_connection import (close_db,
                                                          get_db_connection)

logger = logging.getLogger(__name__)

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
            logger.error(f"Error in update_onboarding: {e}", exc_info=True)
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
            logger.error(f"Error in disable_password_change: {e}", exc_info=True)
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
            logger.error(f"Error resetting lock status: {e}", exc_info=True)
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
            logger.error(f"Error locking user: {e}", exc_info=True)
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

    def create_det_user(self, id_usuario: int, must_change_password: bool) -> bool:
        """
        Crea el registro de detalles de usuario (det_usuarios).
        
        IMPORTANTE: det_usuarios NO tiene campos de auditoría (usr_alta/fch_alta).
        La auditoría se maneja en sy_usuarios.
        
        Args:
            id_usuario: ID del usuario en sy_usuarios
            must_change_password: Si el usuario debe cambiar su password
            
        Returns:
            True si se creó correctamente
        """
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = conn.cursor()
        try:
            cambiar_clave = 'T' if must_change_password else 'F'
            
            # Campos requeridos según estructura de det_usuarios:
            # - terminos_acept: 'F' (no aceptó aún)
            # - cambiar_clave: 'T' o 'F' según parámetro
            # - last_conexion: fecha inicial (NOW())
            # - act_conexion: fecha inicial (NOW())
            # - intentos_fallidos: 0 (default)
            cursor.execute("""
                INSERT INTO det_usuarios 
                (id_usuario, terminos_acept, cambiar_clave, last_conexion, act_conexion, intentos_fallidos)
                VALUES (%s, 'F', %s, NOW(), NOW(), 0)
            """, (id_usuario, cambiar_clave))
            
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error creating det_user: {e}", exc_info=True)
            conn.rollback()
            return False
        finally:
            close_db(conn, cursor)


