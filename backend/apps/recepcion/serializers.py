from rest_framework import serializers


class CreateVisitSerializer(serializers.Serializer):
    """Datos requeridos para registrar la llegada de un paciente (check-in)."""

    noExp           = serializers.CharField(max_length=20)
    pkNum           = serializers.IntegerField(min_value=0, default=0)
    nombrePaciente  = serializers.CharField(max_length=255, required=False, allow_blank=True)
    arrivalType = serializers.ChoiceField(choices=("appointment", "walk_in"))
    serviceType = serializers.ChoiceField(
        choices=("medicina_general", "especialidad", "urgencias"),
        required=False,
        default="medicina_general",
    )
    appointmentId  = serializers.CharField(required=False, allow_blank=True, max_length=64)
    doctorId       = serializers.IntegerField(min_value=1, required=False)
    consultorioId  = serializers.IntegerField(min_value=1, required=False)
    notes          = serializers.CharField(required=False, allow_blank=True, max_length=255)
    horaConsulta   = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None, max_length=8)
    fechaConsulta  = serializers.DateField(required=False, allow_null=True, default=None, input_formats=["%Y-%m-%d"])

    def validate(self, attrs):
        arrival_type   = attrs.get("arrivalType")
        appointment_id = (attrs.get("appointmentId") or "").strip()

        if arrival_type == "appointment" and not appointment_id:
            raise serializers.ValidationError(
                {"appointmentId": "appointmentId es obligatorio para arrivalType=appointment."}
            )

        if arrival_type == "walk_in" and appointment_id:
            raise serializers.ValidationError(
                {"appointmentId": "appointmentId debe ir vacío para arrivalType=walk_in."}
            )

        if attrs.get("serviceType") == "urgencias" and arrival_type != "walk_in":
            raise serializers.ValidationError(
                {"arrivalType": "Urgencias solo permite registro de llegada sin cita."}
            )

        attrs["appointmentId"] = appointment_id or None
        return attrs


class ListVisitsQuerySerializer(serializers.Serializer):
    """Parámetros de filtro para la cola de visitas."""

    page        = serializers.IntegerField(min_value=1, required=False, default=1)
    pageSize    = serializers.IntegerField(min_value=1, max_value=100, required=False, default=20)
    status      = serializers.ChoiceField(
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
    date        = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    doctorId      = serializers.IntegerField(min_value=1, required=False)
    consultorioId = serializers.IntegerField(min_value=1, required=False)
    centroId      = serializers.IntegerField(min_value=1, required=False)
    serviceType   = serializers.ChoiceField(
        choices=("medicina_general", "especialidad", "urgencias"),
        required=False,
    )
    noExp       = serializers.CharField(max_length=20, required=False)
    fechaDesde  = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    fechaHasta  = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    folio       = serializers.CharField(max_length=64, required=False)


class UpdateVisitStatusSerializer(serializers.Serializer):
    """Estado destino permitido desde recepción."""

    targetStatus = serializers.ChoiceField(
        choices=("en_somatometria", "cancelada", "no_show")
    )


class PatientLookupQuerySerializer(serializers.Serializer):
    """Parámetro de búsqueda para lookup de paciente por expediente."""

    noExp = serializers.CharField(max_length=20)


class VerificarQRSerializer(serializers.Serializer):
    """
    Payload crudo leído del código QR del comprobante de cita (o tipeado a
    mano si el lector falla). Formato exacto ``"{folio}:{firma}"`` -- se
    valida en ``apps.recepcion.uses_case.qr_checkin_usecase`` reusando
    ``apps.portal_citas.services.comprobante_service.verificar_payload_qr``.
    """

    payload = serializers.CharField(max_length=200)
