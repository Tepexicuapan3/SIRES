from apps.authentication.application.auth_policy_service import AuthPolicyService
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import (
    AuthServiceError,
    PolicyStoreUnavailableError,
)
from apps.authentication.services.otp_service import (
    consume_code_atomic,
    get_code,
)
from apps.authentication.services.token_service import create_reset_token

policy_service = AuthPolicyService()


def verify_reset_code(email, code, ip_address=None):
    # Valida OTP y genera reset token.
    try:
        policy_service.check_verify_code(email)

        otp_data = get_code(email)
        if not otp_data:
            raise AuthServiceError(
                "CODE_EXPIRED",
                "El código ha expirado o fue invalidado",
                400,
            )

        if otp_data.get("code") != code:
            policy_service.record_verify_failure(email)
            raise AuthServiceError(
                "INVALID_CODE",
                "Código incorrecto",
                400,
            )

        consumed = consume_code_atomic(email, code)
        if not consumed:
            raise AuthServiceError(
                "INVALID_CODE",
                "Código incorrecto",
                400,
            )

        policy_service.record_verify_success(email)

        user = UserRepository.get_by_email(email)
        if not user:
            raise AuthServiceError(
                "CODE_EXPIRED",
                "El código ha expirado o fue invalidado",
                400,
            )

        reset_token = create_reset_token(user)
        return {"valid": True, "reset_token": reset_token, "user": user}
    except PolicyStoreUnavailableError as exc:
        raise AuthServiceError(
            "SERVICE_UNAVAILABLE",
            "Servicio temporalmente no disponible",
            503,
            details={
                "policy": {
                    "policyKey": "policy.enforcement.backend_unavailable",
                    "threshold": 1,
                    "window": "immediate",
                }
            },
        ) from exc
