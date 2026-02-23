from apps.authentication.services.auth_revision import (
    AUTH_REVISION_HEADER,
    serialize_auth_revision,
)
from apps.authentication.models import SyUsuario


MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class JWTAuthenticationMiddleware:
    """Publica metadatos de sesión para sincronización frontend."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        user = getattr(request, "user", None)
        if user and getattr(user, "is_authenticated", False):
            if request.method in MUTATING_METHODS:
                fresh_user = SyUsuario.objects.filter(id_usuario=user.id_usuario).first()
                if fresh_user:
                    user = fresh_user

            response[AUTH_REVISION_HEADER] = serialize_auth_revision(user)

        return response
