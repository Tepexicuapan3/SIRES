from datetime import timedelta, datetime
from flask_jwt_extended import create_access_token
from src.infrastructure.repositories.password_reset_repository import PasswordResetRepository
from src.infrastructure.repositories.user_repository import UserRepository


class VerifyResetCodeUseCase:

    def __init__(self):
        self.repo = PasswordResetRepository()
        self.user_repo = UserRepository()

    def execute(self, email: str, code: str):

        record = self.repo.get_reset_record(email)

        # en caso de que no exista el codigo (revisar el mensaje generico)
        if not record:
            return {"valid": False, "message": "Código inválido"}, 400

        # valida los intentos
        if record["attempts"] >= 3:
            self.repo.delete_reset_record(email)
            return {"valid": False, "message": "Código inválido"}, 400

        # valida la expericaion 
        if datetime.now() > record["expires_at"]:
            self.repo.delete_reset_record(email)
            return {"valid": False, "message": "El código ha expirado"}, 400

        # aplica validacion en el codigo
        if record["otp_code"] != code:
            self.repo.increment_attempts(email)
            return {"valid": False, "message": "Código incorrecto"}, 400

        # OTP correcto se borra
        self.repo.delete_reset_record(email)

        # obtiene el usuario
        user = self.user_repo.get_user_by_email(email)
        if not user:
            return {"valid": False, "message": "Código inválido"}, 400

        # JWT temporal
        reset_token = create_access_token(
            identity=user["id"],
            additional_claims={"scope": "password_reset"},
            expires_delta=timedelta(minutes=5)
        )

        #si es que todo salio bien
        return {
            "valid": True,
            "reset_token": reset_token
        }, 200
