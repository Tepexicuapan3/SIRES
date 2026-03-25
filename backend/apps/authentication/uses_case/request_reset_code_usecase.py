from apps.authentication.application.auth_policy_service import AuthPolicyService
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import (
    AuthServiceError,
    PolicyStoreUnavailableError,
)
from apps.authentication.services.email_service import send_reset_code_email
from apps.authentication.services.otp_service import (
    generate_code,
    store_code,
)

policy_service = AuthPolicyService()


def request_reset_code(email, ip_address=None):
    # Genera OTP si el usuario existe.
    try:
        policy_service.check_reset_request(email, ip_address)

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

        policy_service.record_reset_request(email, ip_address)
        return user
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
