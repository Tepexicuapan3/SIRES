"""
apps/portal_citas/errors.py
==============================
Excepción de dominio para el flujo de autenticación del portal.
Espeja ``apps.authentication.services.errors.AuthServiceError`` (mismo
contrato ``code`` / ``message`` / ``status_code`` / ``details``) para poder
reusar ``response_service.error_response`` sin cambios.
"""


class PortalAuthError(Exception):
    def __init__(self, code, message, status_code, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class PortalReservaError(Exception):
    """
    Excepción de dominio para el flujo de reserva de citas del portal
    (Fase 4). Mismo contrato ``code``/``message``/``status_code``/``details``
    que ``PortalAuthError`` (separada de esa clase porque no es un error de
    autenticación) para poder reusar ``response_service.error_response`` sin
    cambios.
    """

    def __init__(self, code, message, status_code, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class PortalCancelacionError(Exception):
    """
    Excepción de dominio para el flujo de cancelación de citas del portal
    (Fase 6). Mismo contrato ``code``/``message``/``status_code``/``details``
    que ``PortalAuthError``/``PortalReservaError`` (separada de esas clases
    porque no es ni un error de autenticación ni de reserva) para poder
    reusar ``response_service.error_response`` sin cambios.
    """

    def __init__(self, code, message, status_code, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
