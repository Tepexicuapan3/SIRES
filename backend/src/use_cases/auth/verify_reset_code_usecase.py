from datetime import timedelta, datetime
from flask_jwt_extended import create_access_token
from src.infrastructure.repositories.password_reset_repository import PasswordResetRepository
from src.infrastructure.repositories.user_repository import UserRepository

class VerifyResetCodeUseCase:

    def __init__(self):
        self.repo = PasswordResetRepository()
        self.user_repo = UserRepository()

    def execute(self, email, code):
        record = self.repo.get_reset_record(email)

        # Siempre responder con el mismo mensaje si no existe -> evitar user enumeration
        if not record:
            return {
                "valid": False,
                "message": "Código inválido"
            }, None

        # 1. Validar intentos
        if record["attempts"] >= 3:
            self.repo.delete_reset_record(email)
            return {
                "valid": False,
                "message": "Código expirado o inválido"
            }, None

        # 2. Validar expiración
        if datetime.now() > record["expires_at"]:
            self.repo.delete_reset_record(email)
            return {
                "valid": False,
                "message": "El código ha expirado"
            }, None

        # 3. Validar OTP
        if record["otp_code"] != code:
            self.repo.increment_attempts(email)
            return {
                "valid": False,
                "message": "Código incorrecto"
            }, None

        # 4. Correcto → invalidamos el OTP
        self.repo.delete_reset_record(email)

        # 5. Obtener user_id
        user = self.user_repo.get_user_by_email(email)
        if not user:
            # no revelamos nada
            return {
                "valid": False,
                "message": "Código inválido"
            }, None

        # 6. Crear el JWT temporal con scope password_reset
        reset_token = create_access_token(
            identity=user["id"],
            additional_claims={"scope": "password_reset"},
            expires_delta=timedelta(minutes=5)
        )

        return {
            "valid": True,
            "reset_token": reset_token
        }, None
