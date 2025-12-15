import random
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.repositories.password_reset_repository import PasswordResetRepository
from src.infrastructure.email.email_service import EmailService


class RequestResetCodeUseCase:

    def __init__(self):
        self.user_repo = UserRepository()
        self.reset_repo = PasswordResetRepository()
        self.email_service = EmailService()

    def execute(self, email: str):

        # busca usuario sin importar que exista
        user = self.user_repo.get_user_by_email(email)

        if user:
            # genera codigo OTP en el rango
            otp = f"{random.randint(100000, 999999)}"

            # guarda el OTP en redis
            saved = self.reset_repo.save_or_replace_code(email, otp)

            if saved:
            # envia el correo
                try:
                    self.email_service.send_reset_code(email, otp)
                    print(f"[OTP] enviado a {email}: {otp}")
                except Exception as e:
                    print("Error enviando correo:", e)

        # respuesta generica 
        return {
            "message": "Si el correo existe, se han enviado instrucciones"
        }, 200
