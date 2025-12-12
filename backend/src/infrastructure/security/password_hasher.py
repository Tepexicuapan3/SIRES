# src/infrastructure/security/password_hasher.py

from werkzeug.security import generate_password_hash, check_password_hash

class PasswordHasher:

    @staticmethod
    #genera el hash de la contrasena
    def hash_password(password: str):
        return generate_password_hash(password)

    @staticmethod
    #verifica el hash del texto plano con el de la bd
    def verify_password(hashed, plain):
        return check_password_hash(hashed, plain)
