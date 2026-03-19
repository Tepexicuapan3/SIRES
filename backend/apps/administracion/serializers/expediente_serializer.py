'''from rest_framework import serializers

from administracion.models.empleado import Empleado
from administracion.models.familiar import Familiar


class FamiliarSerializer(serializers.ModelSerializer):

    class Meta:
        model = Familiar
        fields = "__all__"


class EmpleadoSerializer(serializers.ModelSerializer):

    familiares = serializers.SerializerMethodField()

    class Meta:
        model = Empleado
        fields = "__all__"

    def get_familiares(self, obj):

        familiares = Familiar.objects.filter(no_expf=obj.no_exp)

        return FamiliarSerializer(familiares, many=True).data'''

from rest_framework import serializers
from ..models import DntFotosCredenciales


# ─────────────────────────────────────────────
# Foto
# ─────────────────────────────────────────────

class FotoCredencialSerializer(serializers.ModelSerializer):
    """
    Serializa la foto ya convertida a base64 (el servicio lo hace antes).
    El campo `foto` llega como str base64 desde el servicio.
    """

    foto = serializers.CharField(read_only=True)   # base64 string procesado

    class Meta:
        model  = DntFotosCredenciales
        fields = [
            'id_empleado',
            'tipo_foto',
            'foto',
            'fecha_toma',
            'fec_actualizacion',
            'pk_num',
            'id_clave_foto',
        ]


# ─────────────────────────────────────────────
# Empleado
# ─────────────────────────────────────────────

class EmpleadoExpedienteSerializer(serializers.Serializer):
    """
    Serializer manual para el resultado de la consulta raw de empleados
    (incluye campos calculados: ESTATUS, CLINICA, EDAD, FOTO).
    """

    NO_EXP       = serializers.CharField()
    DS_PATERNO   = serializers.CharField(allow_null=True)
    DS_MATERNO   = serializers.CharField(allow_null=True)
    DS_NOMBRE    = serializers.CharField(allow_null=True)
    CD_LABORAL   = serializers.CharField(allow_null=True)
    CVE_BAJA     = serializers.CharField(allow_null=True)
    FEC_BAJA     = serializers.DateField(allow_null=True)
    FE_NAC       = serializers.DateField(allow_null=True)
    FEC_VIG      = serializers.DateField(allow_null=True)
    PARENTESCO   = serializers.CharField(default='TRABAJADOR')
    CLINICA      = serializers.CharField(allow_null=True)
    ESTATUS      = serializers.CharField()
    EDAD         = serializers.IntegerField(allow_null=True)
    FOTO         = serializers.CharField(allow_null=True)   # base64


# ─────────────────────────────────────────────
# Familiar
# ─────────────────────────────────────────────

class FamiliarExpedienteSerializer(serializers.Serializer):
    """
    Serializer manual para familiares (resultado de consulta raw).
    """

    NO_EXPF      = serializers.CharField()
    PK_NUM       = serializers.IntegerField()
    DS_PATERNO   = serializers.CharField(allow_null=True)
    DS_MATERNO   = serializers.CharField(allow_null=True)
    DS_NOMBRE    = serializers.CharField(allow_null=True)
    CD_PARENTESCO = serializers.CharField(allow_null=True)
    FE_NAC       = serializers.DateField(allow_null=True)
    FEC_VIG      = serializers.DateField(allow_null=True)
    CLINICA      = serializers.CharField(allow_null=True)
    ESTATUS      = serializers.CharField()
    EDAD         = serializers.IntegerField(allow_null=True)
    FOTO         = serializers.CharField(allow_null=True)   # base64


# ─────────────────────────────────────────────
# Response compuesto
# ─────────────────────────────────────────────

class ExpedienteResponseSerializer(serializers.Serializer):
    empleados  = EmpleadoExpedienteSerializer(many=True)
    familiares = FamiliarExpedienteSerializer(many=True)


# ─────────────────────────────────────────────
# Input para sincronización Oracle → Postgres
# ─────────────────────────────────────────────

class ActualizarExpedienteSerializer(serializers.Serializer):
    """Valida el body del endpoint de actualización/sincronización."""

    expediente = serializers.CharField(
        max_length=20,
        help_text="Número de expediente del empleado a sincronizar desde Oracle.",
    )