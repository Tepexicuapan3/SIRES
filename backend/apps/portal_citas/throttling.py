"""
apps/portal_citas/throttling.py
==================================
Rate limiting por IP para los endpoints públicos de autenticación del
portal (iniciar sesión, capturar correo, verificar código).

Se sobreescribe ``parse_rate()`` para fijar una ventana exacta de 10
minutos: el formato nativo de DRF (``"<n>/<periodo>"``) solo admite
``s``/``m``/``h``/``d`` como período (ver
``rest_framework.throttling.SimpleRateThrottle.parse_rate``), no permite
un múltiplo de minutos. No se toca ``settings.REST_FRAMEWORK`` para no
acoplar esta app al bloque de configuración global.
"""

from rest_framework.throttling import AnonRateThrottle


class PortalAuthRateThrottle(AnonRateThrottle):
    """10 intentos cada 10 minutos, por IP."""

    rate = "10/10min"  # valor informativo; la ventana real la fija parse_rate()

    def parse_rate(self, rate):
        return (10, 60 * 10)
