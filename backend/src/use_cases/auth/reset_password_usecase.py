from flask_jwt_extended import get_jwt, get_jwt_identity
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.security.password_hasher import PasswordHasher


class ResetPasswordUseCase:

    def __init__(self):
        self.user_repository = UserRepository()

    # Restablece la contraseña usando el JWT temporal (scope=password_reset).
    def execute(self, new_password: str):

        #obtiene claims del token
        claims = get_jwt()
        scope = claims.get("scope")

        if scope != "password_reset":
            return {
                "success": False,
                "message": "Token no autorizado para restablecer contraseña."
            }, 403

        # obtiene user_id desde identity del JWT
        user_id = get_jwt_identity()

        # aplica hash a la nueva contra
        hashed_password = PasswordHasher.hash_password(new_password)

        # actualiza la contraseña en la base de datos
        updated = self.user_repository.update_password_by_id(user_id, hashed_password)

        if not updated: #en caso que no se pueda actualizar
            return {
                "success": False,
                "message": "No se pudo actualizar la contraseña."
            }, 400

        # actualizada correctamente
        return {
            "success": True,
            "message": "La contraseña ha sido actualizada correctamente."
        }, 200
