import random
from datetime import datetime, timedelta

# Aun no se guarda en la base de datos

OTP_STORE = {}  
""" formato:
 email: { "code": "123456", "expires": datetime, "attempts": 0 } """

class OTPService:

    @staticmethod
    def generate_code():
        return str(random.randint(100000, 999999))

    @staticmethod
    def save_code(email: str, code: str):
        OTP_STORE[email] = {
            "code": code,
            "expires": datetime.utcnow() + timedelta(minutes=10),
            "attempts": 0
        }

    @staticmethod
    def verify_code(email: str, code: str):
        record = OTP_STORE.get(email)

        if not record:
            return False, "Código no encontrado"

        if record["attempts"] >= 3:
            return False, "Demasiados intentos fallidos"

        if datetime.utcnow() > record["expires"]:
            return False, "El código ha expirado"

        if record["code"] != code:
            record["attempts"] += 1
            return False, "Código incorrecto"

        # válido → eliminar
        del OTP_STORE[email]
        return True, "Código válido"
