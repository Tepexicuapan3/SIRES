"""
apps/portal_citas/services/token_service.py
==============================================
Emisión del token de acceso del portal: Bearer, NUNCA cookie (el portal
puede vivir en un dominio distinto y las cookies cross-site no son
confiables).

Usa las clases de bajo nivel de simplejwt (``AccessToken()``) SIN pasar por
``RefreshToken.for_user()`` — ``PortalSesion`` no es un modelo de usuario
Django. El token es un puntero opaco a ``PortalSesion``: no lleva no_exp,
pk_num, correo ni nombre en el payload.
"""

from datetime import timedelta

from rest_framework_simplejwt.tokens import AccessToken

# Nombre de claim deliberadamente distinto de `token_type` (que ya usa
# simplejwt internamente para distinguir access/refresh) para no chocar.
PORTAL_TOKEN_TYPE_CLAIM = "token_type_portal"
PORTAL_TOKEN_TYPE_VALUE = "portal"
PORTAL_SESSION_CLAIM = "portal_session_id"

# Igual al tiempo de vida de PortalSesion.
PORTAL_SESSION_LIFETIME = timedelta(minutes=25)


def issue_portal_access_token(sesion) -> str:
    token = AccessToken()
    token[PORTAL_TOKEN_TYPE_CLAIM] = PORTAL_TOKEN_TYPE_VALUE
    token[PORTAL_SESSION_CLAIM] = str(sesion.id)
    token.set_exp(lifetime=PORTAL_SESSION_LIFETIME)
    return str(token)
