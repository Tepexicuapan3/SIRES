from werkzeug.security import generate_password_hash, check_password_hash

class PasswordHasher:

    @staticmethod
    def hash_password(password: str):
        return generate_password_hash(password)

    @staticmethod
    def verify_password(hashed, plain):
        return check_password_hash(hashed, plain)
