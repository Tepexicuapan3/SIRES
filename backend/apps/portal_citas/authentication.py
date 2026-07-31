"""
apps/portal_citas/authentication.py
======================================
Autenticación DRF del portal de Citas en Línea.

Lee ``Authorization: Bearer <token>`` (NUNCA cookie — el sistema interno de
staff usa cookie HttpOnly vía
``apps.authentication.services.cookie_auth.CookieJWTAuthentication``, pero
el portal puede vivir en un dominio distinto y las cookies cross-site no
son confiables).

Resuelve ``PortalSesion`` a partir del claim ``portal_session_id`` y expone
``request.portal_miembro`` / ``request.portal_sesion``. Deliberadamente NO
toca ``request.user`` (más allá de dejarlo en ``AnonymousUser``) para no
confundirlo con el auth interno de staff (``SyUsuario``).
"""

from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from apps.portal_citas.models import PortalSesion
from apps.portal_citas.services.token_service import (
    PORTAL_SESSION_CLAIM,
    PORTAL_TOKEN_TYPE_CLAIM,
    PORTAL_TOKEN_TYPE_VALUE,
)


class PortalTokenAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith(f"{self.keyword} "):
            return None  # Sin header Bearer: deja pasar (permission class exige portal_miembro).

        raw_token = auth_header[len(self.keyword):].strip()
        if not raw_token:
            return None

        try:
            token = AccessToken(raw_token)
        except TokenError as exc:
            raise AuthenticationFailed("Token inválido o expirado") from exc

        if token.get(PORTAL_TOKEN_TYPE_CLAIM) != PORTAL_TOKEN_TYPE_VALUE:
            # No es un token del portal (podría ser del auth interno); no es
            # nuestro dominio, no levantamos error para no bloquear a otros
            # authenticators que puedan estar registrados en la vista.
            return None

        session_id = token.get(PORTAL_SESSION_CLAIM)
        if not session_id:
            raise AuthenticationFailed("Token de portal inválido")

        sesion = (
            PortalSesion.objects
            .select_related("portal_miembro")
            .filter(id=session_id, revocado=False)
            .first()
        )
        if not sesion or sesion.expira_en <= timezone.now():
            raise AuthenticationFailed("Sesión de portal inválida o expirada")

        request.portal_miembro = sesion.portal_miembro
        request.portal_sesion = sesion
        # user=AnonymousUser (no None) para que cualquier código que toque
        # request.user.is_authenticated siga funcionando sin romperse.
        return (AnonymousUser(), token)

    def authenticate_header(self, request):
        return self.keyword
