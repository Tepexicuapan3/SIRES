from datetime import datetime, timedelta
from src.infrastructure.database.mysql_connection import get_db_connection, close_db

class PasswordResetRepository:

    def save_or_replace_code(self, email: str, otp: str, minutes: int = 10):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            # elimina OTP previo 
            cursor.execute("""
                DELETE FROM redis.codigos_otp
                WHERE email = %s
            """, (email,))

            # inserta nuevo OTP
            cursor.execute("""
                INSERT INTO redis.codigos_otp
                (email, otp_code, expires_at, attempts, created_at)
                VALUES (%s, %s, %s, 0, NOW())
            """, (
                email,
                otp,
                datetime.now() + timedelta(minutes=minutes)
            ))

            conn.commit()
            return True

        except Exception as e:
            print("Error saving OTP:", e)
            return False

        finally:
            close_db(conn, cursor)

    def get_by_email(self, email: str):
        conn = get_db_connection()
        if not conn:
            return None

        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT *
                FROM redis.codigos_otp
                WHERE email = %s
                LIMIT 1
            """, (email,))
            return cursor.fetchone()

        finally:
            close_db(conn, cursor)

    def increment_attempts(self, email: str):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE redis.codigos_otp
                SET attempts = attempts + 1
                WHERE email = %s
            """, (email,))
            conn.commit()
            return True
        finally:
            close_db(conn, cursor)

    def delete_by_email(self, email: str):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                DELETE FROM redis.codigos_otp
                WHERE email = %s
            """, (email,))
            conn.commit()
            return True
        finally:
            close_db(conn, cursor)
    
    #elimina los codigos OTP que ya no tengan vigencia en la base de datos
    def delete_expired_codes(self):
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            cursor.execute("""
                DELETE FROM redis.codigos_otp
                WHERE expires_at < NOW()
            """)
            conn.commit()
            return True

        except Exception as e:
            print("Error deleting expired OTPs:", e)
            return False

        finally:
            close_db(conn, cursor)

