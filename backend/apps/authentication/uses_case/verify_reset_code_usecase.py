from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.otp_service import (
    OTP_ATTEMPT_LIMIT,
    clear_code,
    get_code,
    increment_attempts,
)
from apps.authentication.services.token_service import create_reset_token


def verify_reset_code(email, code):
    # Valida OTP y genera reset token.
    otp_data = get_code(email)
    if not otp_data:
        raise AuthServiceError(
            "CODE_EXPIRED",
            "El código ha expirado o fue invalidado",
            400,
        )

    attempts = otp_data.get("attempts", 0)
    if attempts >= OTP_ATTEMPT_LIMIT:
        clear_code(email)
        raise AuthServiceError(
            "RATE_LIMIT_EXCEEDED",
            "Demasiadas solicitudes, espera un momento",
            429,
        )

    if otp_data.get("code") != code:
        increment_attempts(email)
        updated = get_code(email)
        if updated and updated.get("attempts", 0) >= OTP_ATTEMPT_LIMIT:
            clear_code(email)
            raise AuthServiceError(
                "RATE_LIMIT_EXCEEDED",
                "Demasiadas solicitudes, espera un momento",
                429,
            )
        raise AuthServiceError(
            "INVALID_CODE",
            "Código incorrecto",
            400,
        )

    clear_code(email)
    user = UserRepository.get_by_email(email)
    if not user:
        raise AuthServiceError(
            "CODE_EXPIRED",
            "El código ha expirado o fue invalidado",
            400,
        )

    reset_token = create_reset_token(user)
    return {"valid": True, "reset_token": reset_token, "user": user}
