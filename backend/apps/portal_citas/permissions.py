"""
apps/portal_citas/permissions.py
===================================
Permission class DRF para endpoints del portal que requieren una sesión ya
iniciada. Los 3 endpoints de autenticación de esta fase (iniciar sesión,
capturar correo, verificar código) NO la usan — son el proceso de login en
sí mismo.
"""

from rest_framework.permissions import BasePermission


class IsPortalUser(BasePermission):
    message = "Se requiere una sesión de portal válida."

    def has_permission(self, request, view):
        return getattr(request, "portal_miembro", None) is not None
