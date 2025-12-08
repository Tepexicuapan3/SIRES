import random
from src.infrastructure.repositories.password_reset_repository import PasswordResetRepository
from src.infrastructure.repositories.user_repository import UserRepository  
from src.infrastructure.security.password_hasher import PasswordHasher
from src.domain.dto.reset_password_dto import ResetPasswordDTO
from datetime import datetime

class RequestResetCodeUseCase:

    def __init__(self):
        self.reset_repo = PasswordResetRepository()
        self.user_repo = UserRepository()

    def execute(self, email):
        # 1. Buscar usuario (SIN revelar si existe o no)
        user = self.user_repo.get_user_by_email(email)

        # 2. Generar OTP SI el usuario existe
        if user:
            otp = f"{random.randint(100000, 999999)}"

            saved = self.reset_repo.save_reset_code(email, otp)

            if not saved:
                # Pero igual devolvemos OK para evitar enumeración
                print("Warning: OTP not saved for:", email)

            # Aquí iría el envío de correo real
            print(f"[DEBUG] Código OTP para {email}: {otp}")

        # 3. Siempre devolver mensaje genérico
        return {
            "message": "Si el correo existe, se han enviado instrucciones"
        }, None
    

    def execute(self, dto: ResetPasswordDTO):

        # 1. Validar que el código existe, no ha expirado y no está usado
        code_info = self.reset_repo.validate_code(dto.email, dto.code)

        if not code_info:
            return {"error": "Invalid or expired code"}, 400

        # 2. Generar hash usando generate_password_hash
        hashed_password = PasswordHasher.hash_password(dto.new_password)

        # 3. Actualizar contraseña del usuario en sy_usuarios
        updated = self.user_repo.update_password(dto.email, hashed_password)

        if not updated:
            return {"error": "User not found or password not updated"}, 404

        # 4. Marcar OTP como usado
        self.reset_repo.mark_as_used(code_info["id"])

        return {"message": "Password reset successfully"}, 200
