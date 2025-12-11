from flask_jwt_extended import get_jwt_identity, get_jwt
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.security.password_hasher import PasswordHasher


class RequestResetCodeUseCase:

    def __init__(self):
        self.user_repo = UserRepository()

    def execute(self, new_password: str):

        # 1. Validar scope
        claims = get_jwt()
        if claims.get("scope") != "password_reset":
            return {
                "success": False,
                "message": "Token inválido para esta operación."
            }, 403

        # 2. Obtener usuario del token
        user_id = get_jwt_identity()

        # 3. Hash
        hashed = PasswordHasher.hash_password(new_password)

        # 4. Actualizar
        updated = self.user_repo.update_password_by_id(user_id, hashed)

        if not updated:
            return {
                "success": False,
                "message": "No se pudo actualizar la contraseña."
            }, 400

        return {
            "success": True,
            "message": "La contraseña ha sido actualizada correctamente."
        }, 200
