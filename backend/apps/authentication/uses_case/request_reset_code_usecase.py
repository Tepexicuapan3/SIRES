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
    profile = getattr(user, "detalle", None)
    if profile and profile.nombre_completo:
        user_name = profile.nombre_completo
    else:
        name_parts = [
            profile.nombre if profile else "",
            profile.paterno if profile else "",
            profile.materno if profile else "",
        ]
        user_name = " ".join([part for part in name_parts if part]).strip()
        if not user_name:
            user_name = user.usuario

    # Envia el codigo al correo del usuario.
    if not send_reset_code_email(email, code, user_name=user_name):
        raise AuthServiceError(
            "INTERNAL_SERVER_ERROR",
            "Error del servidor, intenta nuevamente",
            500,
        )

    return user
