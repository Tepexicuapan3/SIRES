# src/application/use_cases/reset_password_usecase.py

from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.security.password_hasher import PasswordHasher


class ResetPasswordUseCase:

    def __init__(self):
        self.user_repository = UserRepository()
        self.password_hasher = PasswordHasher()

    def reset_password(self, email: str, new_password: str) -> dict:
        """
        Caso de uso para resetear la contraseña de un usuario.
        """

        # 1. Verificar que el correo exista
        user_data = self.user_repository.get_user_by_email(email)
        if not user_data:
            return {
                "success": False,
                "message": "El correo no está registrado."
            }

        # 2. Hashear la nueva contraseña
        hashed_password = self.password_hasher.hash_password(new_password)

        # 3. Actualizar la contraseña
        updated = self.user_repository.update_password(email, hashed_password)

        if not updated:
            return {
                "success": False,
                "message": "No se pudo actualizar la contraseña."
            }

        # 4. Retorno exitoso
        return {
            "success": True,
            "message": "La contraseña ha sido actualizada correctamente."
        }
