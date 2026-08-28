"""
apps/comunicados/errors.py
=============================
Excepción de dominio para el módulo Comunicados. Mismo contrato
``code``/``message``/``status_code``/``details`` que
``apps.portal_citas.errors.PortalAuthError`` para poder reusar
``ErrorMixin._error`` / ``response_service.error_response`` sin cambios.
"""


class ComunicadoError(Exception):
    def __init__(self, code, message, status_code, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
