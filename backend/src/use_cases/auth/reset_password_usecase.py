from flask_jwt_extended import get_jwt, get_jwt_identity
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.security.password_hasher import PasswordHasher


class ResetPasswordUseCase:

    def __init__(self):
        self.user_repository = UserRepository()

    # Restablece la contraseña usando el JWT temporal (scope=password_reset).
    def execute(self, new_password: str):

        # 1. Obtener claims del token
        claims = get_jwt()
        scope = claims.get("scope")

        if scope != "password_reset":
            return {
                "success": False,
                "message": "Token no autorizado para restablecer contraseña."
            }, 403

        # 2. Obtener user_id desde identity del JWT
        user_id = get_jwt_identity()

        # 3. Hashear la nueva contraseña
        hashed_password = PasswordHasher.hash_password(new_password)

        # 4. Actualizar contraseña en la BD
        updated = self.user_repository.update_password_by_id(user_id, hashed_password)

        if not updated:
            return {
                "success": False,
                "message": "No se pudo actualizar la contraseña."
            }, 400

        # 5. Retorno exitoso
        return {
            "success": True,
            "message": "La contraseña ha sido actualizada correctamente."
        }, 200
