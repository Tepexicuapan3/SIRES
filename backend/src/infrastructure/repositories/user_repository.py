# src/infrastructure/repositories/det_user_repository.py
#from src.infrastructure.database.mysql_connection import get_db_connection, close_db
#from datetime import datetime

#class DetUserRepository:

#    def get_det_by_userid(self, id_usuario):
#        conn = get_db_connection()
#        if not conn:
#            return None
#        try:
#            cursor = conn.cursor(dictionary=True)
#            cursor.execute("""
#                SELECT id_detusr, id_usuario, terminos_acept, last_conexion, act_conexion,
#                       token, vida_token, cambiar_clave, ip_ultima, intentos_fallidos, fecha_bloqueo
#                FROM det_usuarios
#                WHERE id_usuario = %s
#                LIMIT 1
#            """, (id_usuario,))
#            return cursor.fetchone()  # ✅ no commit
#        finally:
#            close_db(conn, cursor)

 #   def get_det_by_username(self, username):
#        conn = get_db_connection()
#        if not conn:
#            return None
#        try:
#           cursor = conn.cursor(dictionary=True)
#            cursor.execute("""
#                SELECT d.*
#                FROM det_usuarios d
#                INNER JOIN sy_usuarios u ON u.id_usuario = d.id_usuario
#                WHERE u.usuario = %s
#                LIMIT 1
#            """, (username,))
#            return cursor.fetchone()  # ✅ no commit
#        finally:
#            close_db(conn, cursor)
#
#    def reset_failed_attempts(self, id_detusr):
#        conn = get_db_connection()
#        if not conn:
#           return False
#        try:
#            cursor = conn.cursor()
#            cursor.execute("""
#                UPDATE det_usuarios
#                SET intentos_fallidos = 0, fecha_bloqueo = NULL
#                WHERE id_detusr = %s
#            """, (id_detusr,))
#            conn.commit()  # ✅ commit explícito
#            return True
#        finally:
#            close_db(conn, cursor)

#    def increment_failed_attempts(self, id_detusr, current_attempts):
#        conn = get_db_connection()
#        if not conn:
#            return False
#        try:
#           new_attempts = (current_attempts or 0) + 1
#            cursor = conn.cursor()
#            if new_attempts >= 3:
#                cursor.execute("""
 #                   UPDATE det_usuarios
  #                  SET intentos_fallidos = %s, fecha_bloqueo = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
#                    WHERE id_detusr = %s
#                """, (new_attempts, id_detusr))
#            else:
#                cursor.execute("""
#                    UPDATE det_usuarios
#                    SET intentos_fallidos = %s
#                    WHERE id_detusr = %s
#                """, (new_attempts, id_detusr))
#            conn.commit()  # ✅ commit explícito
#            return True
#        finally:
#            close_db(conn, cursor)

#    def update_on_success_login(self, id_detusr, ip):
#        conn = get_db_connection()
#        if not conn:
#            return False
#        try:
##            cursor = conn.cursor()
#            cursor.execute("""
#                UPDATE det_usuarios
#                SET last_conexion = act_conexion,
#                    act_conexion = NOW(),
#                    ip_ultima = %s,
#                    intentos_fallidos = 0,
#                    fecha_bloqueo = NULL
#                WHERE id_detusr = %s
#            """, (ip, id_detusr))
#            conn.commit()  # ✅ commit explícito
#            return True
#        finally:
#            close_db(conn, cursor)


#class UserRepository:
#
#    def get_user_by_username(self, usuario):
#        conn = get_db_connection()
#        if not conn:
#            return None
#        try:
#            cursor = conn.cursor(dictionary=True)
#            cursor.execute("""
#                SELECT 
#                    id_usuario, usuario, clave, nombre, paterno, materno, 
#                    expediente, curp, img_perfil, correo, est_usuario
#                FROM sy_usuarios
#                WHERE usuario = %s
#                LIMIT 1
#            """, (usuario,))
#            return cursor.fetchone()  # ✅ no commit
#        finally:
#            close_db(conn, cursor)

#    def get_user_roles(self, id_usuario):
#        conn = get_db_connection()
#        if not conn:
#            return []
#        try:
#            cursor = conn.cursor(dictionary=True)
#            cursor.execute("""
#                SELECT cr.rol
#                FROM users_roles ur
#                INNER JOIN cat_roles cr 
#                    ON ur.id_rol = cr.id_rol
#                WHERE ur.id_usuario = %s 
#                  AND ur.est_usr_rol = 'A'
#            """, (id_usuario,))
#            roles = cursor.fetchall()  # ✅ fetchall
#            return [r["rol"] for r in roles]
#        finally:
#            close_db(conn, cursor)




from src.infrastructure.database.mysql_connection import get_db_connection, close_db
from mysql.connector import Error

class UserRepository:

    def get_user_by_username(self, usuario):
        conn = get_db_connection()
        if not conn:
            return None

        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id_usuario, usuario, clave, nombre, paterno, materno,
                       expediente, curp, correo, img_perfil, est_usuario
                FROM sy_usuarios
                WHERE usuario = %s
            """, (usuario,))
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
            return [r["rol"] for r in cursor.fetchall()]
        finally:
            close_db(conn, cursor)

