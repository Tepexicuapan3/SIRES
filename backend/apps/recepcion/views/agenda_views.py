"""
GET /api/v1/citas/agenda?medicoId=X&fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD

Devuelve la agenda semanal de un médico: todos los slots del rango de fechas
con su estado (libre / ocupado) y datos de la cita si la hay.
"""

import logging
from datetime import date, timedelta

from apps.recepcion.repositories.citas_repository import CitasRepository

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request
from apps.authentication.services.authorization_service import has_capability
from apps.authentication.repositories.user_repository import UserRepository
from apps.recepcion.models import HorarioDisponible
from apps.recepcion.services.errors import VisitDomainError

logger = logging.getLogger(__name__)

CITAS_READ_CAPABILITY = "recepcion:citas:read"


class AgendaQuerySerializer(serializers.Serializer):
    medicoId   = serializers.IntegerField(min_value=1)
    fechaDesde = serializers.DateField(input_formats=["%Y-%m-%d"])
    fechaHasta = serializers.DateField(input_formats=["%Y-%m-%d"])

    def validate(self, attrs):
        if attrs["fechaDesde"] > attrs["fechaHasta"]:
            raise serializers.ValidationError(
                {"fechaHasta": "Debe ser mayor o igual a fechaDesde."}
            )
        delta = (attrs["fechaHasta"] - attrs["fechaDesde"]).days
        if delta > 31:
            raise serializers.ValidationError(
                {"fechaHasta": "El rango máximo es 31 días."}
            )
        return attrs


class AgendaSemanalView(APIView):
    """
    Devuelve slots de HorarioDisponible para un médico en un rango de fechas,
    indicando si cada slot está libre u ocupado (y con qué cita).
    """

    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            return error_response(exc.code, exc.message, exc.status_code,
                                  request_id=get_request_id(request))

        auth_user = UserRepository.build_auth_user(user)
        if not has_capability(auth_user.get("permissions", []), CITAS_READ_CAPABILITY):
            return error_response("ROLE_NOT_ALLOWED", "No tienes permiso.",
                                  status.HTTP_403_FORBIDDEN,
                                  request_id=get_request_id(request))

        s = AgendaQuerySerializer(data=request.query_params)
        if not s.is_valid():
            return error_response("VALIDATION_ERROR", "Parámetros inválidos.",
                                  status.HTTP_422_UNPROCESSABLE_ENTITY,
                                  details=s.errors, request_id=get_request_id(request))

        medico_id  = s.validated_data["medicoId"]
        fecha_desde = s.validated_data["fechaDesde"]
        fecha_hasta = s.validated_data["fechaHasta"]

        _slot_qs_kwargs = dict(
            medico_id=medico_id,
            fecha__gte=fecha_desde,
            fecha__lte=fecha_hasta,
        )
        _slot_select = ("consultorio",)

        slots = (
            HorarioDisponible.objects
            .select_related(*_slot_select)
            .filter(**_slot_qs_kwargs)
            .order_by("fecha", "hora")
        )

        if not slots.exists() and fecha_hasta >= date.today():
            dias = (fecha_hasta - date.today()).days + 1
            CitasRepository.generar_slots_medico(medico_id=medico_id, dias_adelante=dias)
            slots = (
                HorarioDisponible.objects
                .select_related(*_slot_select)
                .filter(**_slot_qs_kwargs)
                .order_by("fecha", "hora")
            )

        # Agrupar por fecha
        agenda: dict[str, list] = {}
        dia = fecha_desde
        while dia <= fecha_hasta:
            agenda[dia.isoformat()] = []
            dia += timedelta(days=1)

        for slot in slots:
            fecha_key = slot.fecha.isoformat()
            cita_data = None
            if slot.cita:
                cita    = slot.cita
                det     = getattr(cita.medico.id_usuario, "detalle", None) if cita.medico else None
                cita_data = {
                    "id":             cita.id,
                    "folio":          cita.folio,
                    "noExp":          cita.no_exp,
                    "nombrePaciente": None,  # se omite por privacidad en lista
                    "estatus":        cita.estatus,
                    "servicioTipo":   cita.servicio_tipo,
                    "motivo":         cita.motivo,
                }

            agenda[fecha_key].append({
                "id":            slot.id,
                "hora":          slot.hora.strftime("%H:%M"),
                "duracionMin":   slot.duracion_min,
                "disponible":    slot.disponible,
                "consultorioId": slot.consultorio_id,
                "consultorioNumero": slot.consultorio.numero if slot.consultorio else None,
                "cita":          cita_data,
            })

        return Response({
            "medicoId":   medico_id,
            "fechaDesde": fecha_desde.isoformat(),
            "fechaHasta": fecha_hasta.isoformat(),
            "agenda":     agenda,
        })
