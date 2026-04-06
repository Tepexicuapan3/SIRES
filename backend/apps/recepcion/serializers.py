from rest_framework import serializers
from django.utils import timezone

from .models import CitaMedica, HorarioDisponible, EstatusCita, TipoPaciente, DntFotoCredencial


# ============================================================================
# SERIALIZERS DE VISITAS
# ============================================================================

class CreateVisitSerializer(serializers.Serializer):
    patientId = serializers.IntegerField(min_value=1)
    arrivalType = serializers.ChoiceField(choices=("appointment", "walk_in"))
    serviceType = serializers.ChoiceField(
        choices=("medicina_general", "especialidad", "urgencias"),
        required=False,
        default="medicina_general",
    )
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
                {"appointmentId": "appointmentId debe ir vacío para arrivalType=walk_in."}
            )

        if attrs.get("serviceType") == "urgencias" and arrival_type != "walk_in":
            raise serializers.ValidationError(
                {"arrivalType": "Urgencias solo permite registro de llegada sin cita."}
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
    serviceType = serializers.ChoiceField(
        choices=("medicina_general", "especialidad", "urgencias"),
        required=False,
    )


class UpdateVisitStatusSerializer(serializers.Serializer):
    targetStatus = serializers.ChoiceField(
        choices=("en_somatometria", "cancelada", "no_show")
    )


# ============================================================================
# SERIALIZERS DE CITAS MÉDICAS
# ============================================================================

class PacienteSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=TipoPaciente.choices)
    no_exp = serializers.IntegerField()
    pk_num = serializers.IntegerField()
    nombre_completo = serializers.CharField()
    cd_sexo = serializers.CharField(allow_blank=True)
    # El repository devuelve string ISO o None, no objeto date
    fe_nac = serializers.CharField(allow_null=True, required=False)
    vigente = serializers.BooleanField()
    cd_clinica = serializers.IntegerField(allow_null=True, required=False)
    foto_b64 = serializers.CharField(allow_null=True, required=False)
    parentesco = serializers.CharField(allow_null=True, required=False)


class NucleoFamiliarSerializer(serializers.Serializer):
    trabajador = PacienteSerializer(allow_null=True)
    derechohabientes = PacienteSerializer(many=True)


class SlotDisponibilidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioDisponible
        fields = ["id", "fecha_hora", "consultorio_id", "centro_atencion_id"]


class MedicoAgendaSerializer(serializers.Serializer):
    id_medclin = serializers.IntegerField()
    nombre_completo = serializers.CharField()
    id_centro_atencion = serializers.IntegerField(allow_null=True)
    id_consult = serializers.IntegerField(allow_null=True)
    id_consult2 = serializers.IntegerField(allow_null=True)
    hr_ini = serializers.CharField(allow_null=True, required=False)
    hr_term = serializers.CharField(allow_null=True, required=False)
    hr_ini2 = serializers.CharField(allow_null=True, required=False)
    hr_term2 = serializers.CharField(allow_null=True, required=False)
    dias = serializers.CharField(allow_null=True, required=False)
    est_medclin = serializers.CharField(allow_null=True, required=False)


class ConsultorioAgendaSerializer(serializers.Serializer):
    id_consult = serializers.IntegerField()
    no_consult = serializers.IntegerField(allow_null=True)
    id_trno = serializers.IntegerField(allow_null=True)
    id_centro_atencion = serializers.IntegerField(allow_null=True)
    consult = serializers.CharField(allow_null=True, required=False)
    est_activo = serializers.BooleanField(allow_null=True)


class CrearCitaSerializer(serializers.Serializer):
    tipo_paciente = serializers.ChoiceField(choices=TipoPaciente.choices)
    no_exp = serializers.IntegerField(min_value=1)
    pk_num = serializers.IntegerField(min_value=0, required=False, default=0)
    medico_id = serializers.IntegerField(min_value=1)
    centro_atencion_id = serializers.IntegerField(min_value=1)
    consultorio_id = serializers.IntegerField(min_value=1)
    fecha_hora = serializers.DateTimeField()
    motivo = serializers.CharField(required=False, allow_blank=True, default="")
    observaciones = serializers.CharField(required=False, allow_blank=True, default="")
    email_notificacion = serializers.EmailField(required=False, allow_blank=True, default="")

    def validate_fecha_hora(self, value):
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.get_current_timezone())

        if value <= timezone.now():
            raise serializers.ValidationError("La fecha y hora debe ser futura.")

        return value

    def validate(self, data):
        tipo_paciente = data.get("tipo_paciente")
        pk_num = data.get("pk_num", 0)

        if tipo_paciente == TipoPaciente.TRABAJADOR.value and pk_num != 0:
            raise serializers.ValidationError(
                {"pk_num": "Para un trabajador pk_num debe ser 0."}
            )

        if tipo_paciente == TipoPaciente.DERECHOHABIENTE.value and pk_num <= 0:
            raise serializers.ValidationError(
                {"pk_num": "Para un derechohabiente pk_num debe ser mayor a 0."}
            )

        return data


class CitaMedicaSerializer(serializers.ModelSerializer):
    tipo_paciente_display = serializers.CharField(
        source="get_tipo_paciente_display",
        read_only=True,
    )
    estatus_display = serializers.CharField(
        source="get_estatus_display",
        read_only=True,
    )
    foto_b64 = serializers.SerializerMethodField()

    def get_foto_b64(self, obj):
        try:
            import base64
            foto = DntFotoCredencial.objects.filter(
                id_empleado=str(obj.no_exp),
                pk_num=obj.pk_num,
            ).first()
            if foto and foto.foto:
                return "data:image/jpeg;base64," + base64.b64encode(bytes(foto.foto)).decode()
        except Exception:
            pass
        return None

    class Meta:
        model = CitaMedica
        fields = [
            "id",
            "tipo_paciente",
            "tipo_paciente_display",
            "no_exp",
            "pk_num",
            "medico_id",
            "centro_atencion_id",
            "consultorio_id",
            "fecha_hora",
            "estatus",
            "estatus_display",
            "motivo",
            "observaciones",
            "nombre_paciente",
            "nombre_medico",
            "nombre_centro",
            "nombre_consult",
            "creado_por",
            "created_at",
            "updated_at",
            "foto_b64",
        ]
        read_only_fields = fields



class FiltrosCitasSerializer(serializers.Serializer):
    fecha = serializers.DateField(required=False)
    centro_atencion_id = serializers.IntegerField(required=False, min_value=1)
    medico_id = serializers.IntegerField(required=False, min_value=1)
    estatus = serializers.ChoiceField(choices=EstatusCita.choices, required=False)
    no_exp = serializers.IntegerField(required=False, min_value=1)
    busqueda = serializers.CharField(required=False, allow_blank=True, max_length=100)
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100, default=30)


class CancelarCitaSerializer(serializers.Serializer):
    motivo = serializers.CharField(required=False, allow_blank=True, default="")
    enviar_correo = serializers.BooleanField(required=False, default=True)

