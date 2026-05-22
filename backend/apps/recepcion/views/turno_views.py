"""
GET  /api/v1/turnos-ficha          → Lista turnos configurados
POST /api/v1/turnos-ficha          → Crear turno
PATCH /api/v1/turnos-ficha/{id}    → Actualizar max_fichas u otros campos
GET  /api/v1/turnos-ficha/actual   → Turno activo ahora + fichas usadas hoy
"""

import logging
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request
from apps.recepcion.models import TurnoFichaConfig
from apps.recepcion.services.turno_service import get_turno_actual, get_num_ficha_turno

logger = logging.getLogger(__name__)


# ── Serializers ───────────────────────────────────────────────────────────────

def _turno_to_dict(turno: TurnoFichaConfig) -> dict:
    return {
        "id":         turno.id,
        "nombre":     turno.nombre,
        "horaInicio": turno.hora_inicio.strftime("%H:%M") if turno.hora_inicio else None,
        "horaFin":    turno.hora_fin.strftime("%H:%M")    if turno.hora_fin    else None,
        "maxFichas":  turno.max_fichas,
        "isActive":   turno.is_active,
    }


class TurnoFichaWriteSerializer(serializers.Serializer):
    nombre      = serializers.CharField(max_length=50, required=False)
    horaInicio  = serializers.TimeField(input_formats=["%H:%M", "%H:%M:%S"], required=False)
    horaFin     = serializers.TimeField(input_formats=["%H:%M", "%H:%M:%S"], required=False)
    maxFichas   = serializers.IntegerField(min_value=1, max_value=500, required=False)
    isActive    = serializers.BooleanField(required=False)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _auth(request):
    try:
        return authenticate_request(request), None
    except AuthServiceError as exc:
        return None, error_response(exc.code, exc.message, exc.status_code,
                                    request_id=get_request_id(request))


# ── Views ─────────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name="dispatch")
class TurnoFichaListCreateView(APIView):
    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        _, err = _auth(request)
        if err:
            return err
        turnos = TurnoFichaConfig.objects.all()
        return Response([_turno_to_dict(t) for t in turnos])

    def post(self, request):
        _, err = _auth(request)
        if err:
            return err
        s = TurnoFichaWriteSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_ERROR", "Datos inválidos.",
                                  status.HTTP_422_UNPROCESSABLE_ENTITY,
                                  details=s.errors, request_id=get_request_id(request))
        data = s.validated_data
        turno = TurnoFichaConfig.objects.create(
            nombre=data.get("nombre", ""),
            hora_inicio=data.get("horaInicio"),
            hora_fin=data.get("horaFin"),
            max_fichas=data.get("maxFichas", 18),
            is_active=data.get("isActive", True),
        )
        return Response(_turno_to_dict(turno), status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class TurnoFichaDetailView(APIView):
    authentication_classes = []
    permission_classes     = []

    def patch(self, request, turno_id):
        _, err = _auth(request)
        if err:
            return err
        turno = TurnoFichaConfig.objects.filter(id=turno_id).first()
        if not turno:
            return error_response("NOT_FOUND", "Turno no encontrado.", 404,
                                  request_id=get_request_id(request))
        s = TurnoFichaWriteSerializer(data=request.data, partial=True)
        if not s.is_valid():
            return error_response("VALIDATION_ERROR", "Datos inválidos.",
                                  status.HTTP_422_UNPROCESSABLE_ENTITY,
                                  details=s.errors, request_id=get_request_id(request))
        data = s.validated_data
        if "horaInicio" in data: turno.hora_inicio = data["horaInicio"]
        if "horaFin"    in data: turno.hora_fin    = data["horaFin"]
        if "maxFichas"  in data: turno.max_fichas  = data["maxFichas"]
        if "isActive"   in data: turno.is_active   = data["isActive"]
        if "nombre"     in data: turno.nombre      = data["nombre"]
        turno.save()
        return Response(_turno_to_dict(turno))


@method_decorator(csrf_exempt, name="dispatch")
class TurnoActualView(APIView):
    """Devuelve el turno activo ahora y cuántas fichas se han usado hoy."""

    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        _, err = _auth(request)
        if err:
            return err

        turno = get_turno_actual()
        if not turno:
            return Response({
                "turno":        None,
                "fichasUsadas": 0,
                "maxFichas":    0,
                "disponibles":  0,
            })

        from apps.recepcion.models import Visit
        from django.utils import timezone
        from datetime import datetime

        hoy = timezone.localtime(timezone.now()).date()
        inicio_dt = timezone.make_aware(datetime.combine(hoy, turno.hora_inicio))
        fin_dt    = timezone.make_aware(datetime.combine(hoy, turno.hora_fin))

        fichas_usadas = Visit.objects.filter(
            fch_alta__gte=inicio_dt,
            fch_alta__lt=fin_dt,
        ).count()

        return Response({
            "turno":        _turno_to_dict(turno),
            "fichasUsadas": fichas_usadas,
            "maxFichas":    turno.max_fichas,
            "disponibles":  max(0, turno.max_fichas - fichas_usadas),
        })
