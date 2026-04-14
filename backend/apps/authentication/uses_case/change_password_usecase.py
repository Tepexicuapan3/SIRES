from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError


def change_password(user, current_password, new_password):
    """Cambia contraseña para sesión autenticada (self-service)."""
    if not UserRepository.verify_password(user, current_password):
        raise AuthServiceError(
            "INVALID_CREDENTIALS",
            "Usuario o contraseña incorrectos",
            401,
        )

    if current_password == new_password:
        raise AuthServiceError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            400,
            details={
                "newPassword": [
                    "La nueva contraseña debe ser diferente a la contraseña actual"
                ]
            },
        )

    try:
        validate_password(new_password, user=user)
    except ValidationError as exc:
        raise AuthServiceError(
            "PASSWORD_TOO_WEAK",
            "La contraseña es demasiado débil",
            400,
            details={"newPassword": exc.messages},
        ) from exc

    UserRepository.update_password(user, new_password)
