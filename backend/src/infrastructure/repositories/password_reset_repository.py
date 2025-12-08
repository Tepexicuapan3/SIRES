from src.infrastructure.database.mysql_connection import get_db_connection, close_db
from datetime import datetime, timedelta

class PasswordResetRepository:

    def save_reset_code(self, email, otp_code):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()

        try:
            cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,)) #borra codigos anteriores

            expires_at = datetime.now() + timedelta(minutes=10)

            cursor.execute("""
                INSERT INTO password_resets (email, otp_code, expires_at)
                VALUES (%s, %s, %s)
            """, (email, otp_code, expires_at))

            conn.commit()
            return True

        except Exception as e:
            print("Error saving reset code:", e)
            conn.rollback()
            return False

        finally:
            close_db(conn, cursor)


    def get_reset_record(self, email):
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT * FROM password_resets
                WHERE email = %s
            """, (email,))
            return cursor.fetchone()

        except Exception as e:
            print("Error getting reset record:", e)
            return None

        finally:
            close_db(conn, cursor)


    def increment_attempts(self, email):
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                UPDATE password_resets
                SET attempts = attempts + 1
                WHERE email = %s
            """, (email,))
            conn.commit()
        except Exception as e:
            conn.rollback()
            print("Error incrementing attempts:", e)
        finally:
            close_db(conn, cursor)


    def delete_reset_record(self, email):
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                DELETE FROM password_resets
                WHERE email = %s
            """, (email,))
            conn.commit()
        except:
            conn.rollback()
        finally:
            close_db(conn, cursor)


    def validate_code(self, email, code):
        conn = get_db_connection()
        if not conn:
            return None

        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT id, email, code, used
                FROM password_reset_codes
                WHERE email = %s AND code = %s AND used = 0
                ORDER BY created_at DESC
                LIMIT 1
            """, (email, code))

            return cursor.fetchone()

        except Exception as e:
            print("Error validating reset code:", e)
            return None

        finally:
            close_db(conn, cursor)
            

    def mark_as_used(self, id_code):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE password_reset_codes
                SET used = 1
                WHERE id = %s
            """, (id_code,))

            conn.commit()
            return True

        except Exception as e:
            print("Error marking code as used:", e)
            return False

        finally:
            close_db(conn, cursor)