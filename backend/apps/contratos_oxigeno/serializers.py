from rest_framework import serializers

from .models import ContratoOxigeno


class ContratoOxigenoSerializer(serializers.ModelSerializer):
    # ── camelCase para el frontend ────────────────────────────────────────────
    numContrato   = serializers.CharField(source="num_contrato")
    tpDer         = serializers.CharField(source="tp_der")
    tpDerLabel    = serializers.SerializerMethodField()
    fechaSoporte  = serializers.DateField(source="fecha_soporte",  allow_null=True, required=False)
    vigenciaMeses = serializers.IntegerField(source="vigencia_meses", allow_null=True, required=False)
    vigenciaDias  = serializers.IntegerField(source="vigencia_dias",  allow_null=True, required=False)
    fechaRenovar  = serializers.DateField(source="fecha_renovar",  allow_null=True, required=False)
    diasFaltan    = serializers.IntegerField(source="dias_faltan",  read_only=True,  allow_null=True)
    statusLabel   = serializers.SerializerMethodField()
    fchAlta       = serializers.DateTimeField(source="fch_alta", read_only=True)
    fchModf       = serializers.DateTimeField(source="fch_modf", read_only=True)

    def get_tpDerLabel(self, obj) -> str:        # noqa: N802
        return obj.get_tp_der_display()

    def get_statusLabel(self, obj) -> str:        # noqa: N802
        return obj.get_status_display()

    class Meta:
        model  = ContratoOxigeno
        fields = [
            "id", "sucursal", "numContrato", "nombre", "expediente",
            "tpDer", "tpDerLabel", "clinica", "servicio",
            "fechaSoporte", "vigenciaMeses", "vigenciaDias",
            "fechaRenovar", "diasFaltan", "status", "statusLabel",
            "diagnostico", "fchAlta", "fchModf",
        ]
        read_only_fields = (
            "id", "diasFaltan", "status",
            "tpDerLabel", "statusLabel",
            "fchAlta", "fchModf",
        )
