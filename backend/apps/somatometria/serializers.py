from rest_framework import serializers


class CaptureVitalsSerializer(serializers.Serializer):
    weightKg = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=1, max_value=400)
    heightCm = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=30, max_value=250)

    temperatureC = serializers.DecimalField(
        max_digits=4,
        decimal_places=1,
        min_value=30,
        max_value=45,
        required=False,
        allow_null=True,
    )
    oxygenSaturationPct = serializers.IntegerField(
        min_value=50,
        max_value=100,
        required=False,
        allow_null=True,
    )

    heartRateBpm = serializers.IntegerField(
        min_value=20,
        max_value=250,
        required=False,
        allow_null=True,
    )
    respiratoryRateBpm = serializers.IntegerField(
        min_value=5,
        max_value=80,
        required=False,
        allow_null=True,
    )
    bloodPressureSystolic = serializers.IntegerField(
        min_value=50,
        max_value=260,
        required=False,
        allow_null=True,
    )
    bloodPressureDiastolic = serializers.IntegerField(
        min_value=30,
        max_value=180,
        required=False,
        allow_null=True,
    )
    waistCircumferenceCm = serializers.IntegerField(
        min_value=30,
        max_value=250,
        required=False,
        allow_null=True,
    )
    glucosaCapilarMgdl = serializers.IntegerField(
        min_value=20,
        max_value=800,
        required=False,
        allow_null=True,
    )
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)
    reusedFromVisitId = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
    )

    def validate(self, attrs):
        systolic = attrs.get("bloodPressureSystolic")
        diastolic = attrs.get("bloodPressureDiastolic")

        if (
            systolic is not None
            and diastolic is not None
            and diastolic >= systolic
        ):
            raise serializers.ValidationError(
                {
                    "bloodPressureDiastolic": [
                        "Debe ser menor que bloodPressureSystolic."
                    ]
                }
            )

        return attrs


class EditVitalsSerializer(CaptureVitalsSerializer):
    """
    Serializer de la edicion auditada (Fase 3, D8). Hereda TODA la
    validacion de `CaptureVitalsSerializer` (rangos, TA sistolica >
    diastolica) y agrega `motivo` REQUERIDO (min 5 caracteres) -- una
    correccion sin justificacion no se acepta. `reusedFromVisitId` no
    tiene sentido en una edicion (esto corrige la MISMA fila, no crea una
    nueva por reuso), se elimina del serializer para que ni siquiera
    aparezca como campo aceptado.
    """

    motivo = serializers.CharField(min_length=5, max_length=255)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("reusedFromVisitId", None)
