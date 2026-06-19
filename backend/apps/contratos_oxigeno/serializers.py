from rest_framework import serializers

from .models import ContratoOxigeno


class ContratoOxigenoSerializer(serializers.ModelSerializer):
    # ── camelCase para el frontend ────────────────────────────────────────────
    numContrato   = serializers.CharField(source="num_contrato")
    tpDer         = serializers.CharField(source="tp_der")
    servicio2     = serializers.CharField(source="servicio_2", allow_blank=True, allow_null=True, required=False)
    servicio3     = serializers.CharField(source="servicio_3", allow_blank=True, allow_null=True, required=False)
    tpDerLabel    = serializers.SerializerMethodField()
    fechaSoporte  = serializers.DateField(source="fecha_soporte",  allow_null=True, required=False)
    vigenciaMeses = serializers.IntegerField(source="vigencia_meses", allow_null=True, required=False)
    vigenciaDias  = serializers.IntegerField(source="vigencia_dias",  allow_null=True, required=False)
    fechaRenovar  = serializers.DateField(source="fecha_renovar",  allow_null=True, required=False)
    diasFaltan    = serializers.IntegerField(source="dias_faltan",  read_only=True,  allow_null=True)
    statusLabel   = serializers.SerializerMethodField()
    fchAlta       = serializers.DateTimeField(source="fch_alta", read_only=True)
    fchModf       = serializers.DateTimeField(source="fch_modf", read_only=True)
    vigenciaDh        = serializers.SerializerMethodField()
    fechaNacimientoDh = serializers.SerializerMethodField()
    edadDh            = serializers.SerializerMethodField()

    def get_tpDerLabel(self, obj) -> str:        # noqa: N802
        try:
            return ContratoOxigeno.TpDer(obj.tp_der).label
        except ValueError:
            return obj.tp_der

    def get_statusLabel(self, obj) -> str:        # noqa: N802
        return obj.get_status_display()

    def _dh_info(self, obj) -> dict:
        return self.context.get("dh_info", {}).get(obj.expediente, {})

    def get_vigenciaDh(self, obj) -> str | None:        # noqa: N802
        return self._dh_info(obj).get("vigencia")

    def get_fechaNacimientoDh(self, obj):        # noqa: N802
        return self._dh_info(obj).get("fechaNacimiento")

    def get_edadDh(self, obj):        # noqa: N802
        return self._dh_info(obj).get("edad")

    class Meta:
        model  = ContratoOxigeno
        fields = [
            "id", "sucursal", "numContrato", "nombre", "expediente",
            "tpDer", "tpDerLabel", "clinica", "servicio", "servicio2", "servicio3",
            "telefono", "direccion",
            "fechaSoporte", "vigenciaMeses", "vigenciaDias",
            "fechaRenovar", "diasFaltan", "status", "statusLabel",
            "diagnostico", "fchAlta", "fchModf",
            "vigenciaDh", "fechaNacimientoDh", "edadDh",
        ]
        read_only_fields = (
            "id", "diasFaltan", "status",
            "tpDerLabel", "statusLabel",
            "fchAlta", "fchModf",
            "vigenciaDh", "fechaNacimientoDh", "edadDh",
        )
