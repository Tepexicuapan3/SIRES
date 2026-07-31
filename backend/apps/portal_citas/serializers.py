"""
apps/portal_citas/serializers.py
===================================
Serializers de los 3 endpoints de autenticación del portal. Todos exigen
los mismos tres datos de identidad (no_exp + nombre completo + fecha de
nacimiento) porque el backend re-resuelve la identidad en CADA paso — no
hay token intermedio de pre-sesión.
"""

from rest_framework import serializers


class _IdentidadBaseSerializer(serializers.Serializer):
    noExp = serializers.CharField(max_length=20)
    nombreCompleto = serializers.CharField(max_length=255)
    fechaNacimiento = serializers.DateField(input_formats=["%Y-%m-%d"])


class IniciarSesionSerializer(_IdentidadBaseSerializer):
    pass


class CapturarCorreoSerializer(_IdentidadBaseSerializer):
    # EmailField ya valida formato con el EmailValidator estándar de Django.
    correo = serializers.EmailField()


class VerificarCodigoSerializer(_IdentidadBaseSerializer):
    codigo = serializers.CharField(min_length=6, max_length=6)


class ReservarCitaSerializer(serializers.Serializer):
    """POST /portal/citas (Fase 4)."""

    miembroId = serializers.UUIDField()
    slotId = serializers.IntegerField(min_value=1)
    motivo = serializers.CharField(max_length=255, required=False, allow_blank=True)


class CancelarCitaSerializer(serializers.Serializer):
    """PATCH /portal/citas/{folio}/cancelar (Fase 6). ``motivo`` es opcional."""

    motivo = serializers.CharField(max_length=500, required=False, allow_blank=True)
