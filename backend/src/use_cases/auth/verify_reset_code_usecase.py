from datetime import timedelta
from flask_jwt_extended import create_access_token
from src.infrastructure.repositories.user_repository import UserRepository
from src.use_cases.auth.otp_service import OTPService


class VerifyResetCodeUseCase:
    """
    Use case para verificar código OTP de recuperación de contraseña.
    
    Migrado a Redis: Ahora usa OTPService en lugar de PasswordResetRepository.
    """

    def __init__(self):
        self.user_repo = UserRepository()

    def execute(self, email: str, code: str):
        """
        Verifica el código OTP ingresado por el usuario.
        
        Args:
            email: Email del usuario
            code: Código OTP de 6 dígitos
            
        Returns:
            Tuple[dict, int]: 
                - Si es válido: {"valid": True, "reset_token": JWT}
                - Si es inválido: {"valid": False, "message": razón}
        """
        # Verifica el código OTP usando el servicio
        # OTPService.verify_code() ya maneja:
        # - Verificación de existencia
        # - Validación de expiración (TTL)
        # - Contador de intentos (máximo 3)
        # - Comparación de código
        # - Eliminación tras uso exitoso
        is_valid, message, error_code = OTPService.verify_code(email, code)

        if not is_valid:
            # Código inválido, expirado o agotados los intentos
            return {"valid": False, "message": message}, 400

        # Código válido - obtiene el usuario
        user = self.user_repo.get_user_by_email(email)
        if not user:
            # Usuario fue eliminado entre request y verify
            return {"valid": False, "message": "Código inválido"}, 400

        # JWT temporal para el flujo de password reset
        # (identity DEBE ser string en flask-jwt-extended 4.x)
        reset_token = create_access_token(
            identity=str(user["id_usuario"]),
            additional_claims={"scope": "password_reset"},
            expires_delta=timedelta(minutes=5)
        )

        # Éxito - retorna el token de reset
        return {
            "valid": True,
            "reset_token": reset_token
        }, 200
