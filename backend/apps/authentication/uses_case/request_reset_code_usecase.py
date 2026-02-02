from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.email_service import send_reset_code_email
from apps.authentication.services.otp_service import (
    generate_code,
    rate_limit_request,
    store_code,
)


def request_reset_code(email):
    # Genera OTP si el usuario existe.
    if rate_limit_request(email):
        raise AuthServiceError(
            "RATE_LIMIT_EXCEEDED",
            "Demasiadas solicitudes, espera un momento",
            429,
        )

    user = UserRepository.get_by_email(email)
    if not user:
        raise AuthServiceError("USER_NOT_FOUND", "Usuario no encontrado", 404)

    code = generate_code()
    store_code(email, code)
    # Envia el codigo al correo del usuario.
    if not send_reset_code_email(email, code):
        raise AuthServiceError(
            "INTERNAL_SERVER_ERROR",
            "Error del servidor, intenta nuevamente",
            500,
        )

    return user
