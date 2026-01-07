from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.email.email_service import EmailService
from src.use_cases.auth.otp_service import OTPService


class RequestResetCodeUseCase:
    """
    Use case para solicitar código de recuperación de contraseña.
    
    Migrado a Redis: Ahora usa OTPService en lugar de PasswordResetRepository.
    """

    def __init__(self):
        self.user_repo = UserRepository()
        self.email_service = EmailService()

    def execute(self, email: str):
        """
        Genera y envía un código OTP al email del usuario.
        
        Args:
            email: Email del usuario que solicita recuperación
            
        Returns:
            Tuple[dict, int]: Mensaje genérico (no revela si el usuario existe)
        """
        # Busca usuario sin importar que exista
        user = self.user_repo.get_user_by_email(email)

        if user:
            # Genera código OTP con el servicio
            otp = OTPService.generate_code()

            # Guarda en Redis (reemplaza código anterior si existe)
            # Protección: Si Redis falla, loggear y retornar error
            try:
                OTPService.save_code(email, otp)
            except Exception as e:
                print(f"[ERROR CRÍTICO] Redis no disponible: {e}")
                return {
                    "code": "SERVICE_UNAVAILABLE",
                    "message": "El servicio de recuperación no está disponible. Intenta más tarde."
                }, 503

            # Envía el correo
            # Protección: Si el email falla, loggear pero NO retornar error
            # (por seguridad, no revelamos si el email existe)
            try:
                self.email_service.send_reset_code(email, otp)
                print(f"[OTP] Código enviado a {email}: {otp}")
            except Exception as e:
                print(f"[ERROR] Fallo envío de correo a {email}: {e}")
                print(f"[ERROR] Detalles del error SMTP: {type(e).__name__}")
                # No retornamos error para no revelar si el usuario existe
                # El código quedó guardado en Redis, pero el usuario no lo recibirá

        # Respuesta genérica (no revela si el usuario existe - seguridad)
        return {
            "message": "Si el correo existe, se han enviado instrucciones"
        }, 200
