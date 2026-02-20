from rest_framework import serializers


class CreateVisitSerializer(serializers.Serializer):
    patientId = serializers.IntegerField(min_value=1)
    arrivalType = serializers.ChoiceField(choices=("appointment", "walk_in"))
    appointmentId = serializers.CharField(required=False, allow_blank=True, max_length=64)
    doctorId = serializers.IntegerField(min_value=1, required=False)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate(self, attrs):
        arrival_type = attrs.get("arrivalType")
        appointment_id = (attrs.get("appointmentId") or "").strip()

        if arrival_type == "appointment" and not appointment_id:
            raise serializers.ValidationError(
                {"appointmentId": "appointmentId es obligatorio para arrivalType=appointment."}
            )

        if arrival_type == "walk_in" and appointment_id:
            raise serializers.ValidationError(
                {"appointmentId": "appointmentId debe ir vacio para arrivalType=walk_in."}
            )

        attrs["appointmentId"] = appointment_id or None
        return attrs


class ListVisitsQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(min_value=1, required=False, default=1)
    pageSize = serializers.IntegerField(min_value=1, max_value=100, required=False, default=20)
    status = serializers.ChoiceField(
        choices=(
            "en_espera",
            "en_somatometria",
            "lista_para_doctor",
            "en_consulta",
            "cerrada",
            "cancelada",
            "no_show",
        ),
        required=False,
    )
    date = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    doctorId = serializers.IntegerField(min_value=1, required=False)


class UpdateVisitStatusSerializer(serializers.Serializer):
    targetStatus = serializers.ChoiceField(
        choices=("en_somatometria", "cancelada", "no_show")
    )
