from datetime import timedelta, datetime
from flask_jwt_extended import create_access_token
from src.infrastructure.repositories.password_reset_repository import PasswordResetRepository
from src.infrastructure.repositories.user_repository import UserRepository


class VerifyResetCodeUseCase:

    def __init__(self):
        self.reset_repo = PasswordResetRepository()
        self.user_repo = UserRepository()

    def execute(self, email: str, code: str):

        record = self.reset_repo.get_by_email(email)

        # en caso de que no exista el codigo (revisar el mensaje generico)
        if not record:
            return {"valid": False, "message": "Código inválido"}, 400

        # valida los intentos
        if record["attempts"] >= 3:
            self.reset_repo.delete_by_email(email)
            return {"valid": False, "message": "Código inválido"}, 400

        # valida la expiracion
        if datetime.now() > record["expires_at"]:
            self.reset_repo.delete_by_email(email)
            return {"valid": False, "message": "El código ha expirado"}, 400

        # aplica validacion en el codigo
        if record["otp_code"] != code:
            self.reset_repo.increment_attempts(email)
            return {"valid": False, "message": "Código incorrecto"}, 400

        # OTP correcto se borra
        self.reset_repo.delete_by_email(email)

        # obtiene el usuario
        user = self.user_repo.get_user_by_email(email)
        if not user:
            return {"valid": False, "message": "Código inválido"}, 400

        # JWT temporal
        reset_token = create_access_token(
            identity=user["id_usuario"],
            additional_claims={"scope": "password_reset"},
            expires_delta=timedelta(minutes=5)
        )

        #si es que todo salio bien
        return {
            "valid": True,
            "reset_token": reset_token
        }, 200
