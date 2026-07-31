"""
apps/portal_citas/views.py
=============================
Endpoints del portal de Citas en Línea.

Los 3 endpoints de autenticación (Fase 2) son públicos: sin sesión
iniciada todavía, así que ``authentication_classes = []`` /
``permission_classes = []`` (mismo patrón que las vistas públicas de
``apps.authentication.views`` y ``apps.recepcion``) — son el proceso de
login en sí mismo, ninguno requiere ``IsPortalUser``.

Los endpoints de Fase 3 (núcleo familiar, especialidades, slots), Fase 4
(reserva de citas), Fase 6 (cancelación) y Fase 8 (listado de citas) SÍ
requieren sesión de portal válida:
``authentication_classes = [PortalTokenAuthentication]`` +
``permission_classes = [IsPortalUser]``.

Fuera de alcance: check-in / validación de QR en recepción — eso es de la
Fase 7.
"""

import logging

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.services.response_service import error_response, get_request_id
from apps.portal_citas.authentication import PortalTokenAuthentication
from apps.portal_citas.errors import PortalAuthError, PortalCancelacionError, PortalReservaError
from apps.portal_citas.permissions import IsPortalUser
from apps.portal_citas.serializers import (
    CancelarCitaSerializer,
    CapturarCorreoSerializer,
    IniciarSesionSerializer,
    ReservarCitaSerializer,
    VerificarCodigoSerializer,
)
from apps.portal_citas.services.especialidades_service import listar_especialidades
from apps.portal_citas.services.nucleo_service import obtener_nucleo
from apps.portal_citas.services.slots_service import get_slots_portal
from apps.portal_citas.throttling import PortalAuthRateThrottle
from apps.portal_citas.uses_case.cancelar_cita_usecase import cancelar_cita
from apps.portal_citas.uses_case.capturar_correo_usecase import capturar_correo
from apps.portal_citas.uses_case.iniciar_sesion_usecase import iniciar_sesion
from apps.portal_citas.uses_case.listar_citas_usecase import listar_citas
from apps.portal_citas.uses_case.reservar_cita_usecase import reservar_cita
from apps.portal_citas.uses_case.verificar_codigo_usecase import verificar_codigo

logger = logging.getLogger(__name__)


def _portal_error_response(
    request, exc: PortalAuthError | PortalReservaError | PortalCancelacionError
):
    return error_response(
        exc.code,
        exc.message,
        exc.status_code,
        details=exc.details,
        request_id=get_request_id(request),
    )


@method_decorator(csrf_exempt, name="dispatch")
class IniciarSesionView(APIView):
    """POST /portal/auth/iniciar-sesion"""

    authentication_classes = []
    permission_classes = []
    throttle_classes = [PortalAuthRateThrottle]

    def post(self, request):
        serializer = IniciarSesionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            result = iniciar_sesion(
                serializer.validated_data["noExp"],
                serializer.validated_data["nombreCompleto"],
                serializer.validated_data["fechaNacimiento"],
            )
        except PortalAuthError as exc:
            return _portal_error_response(request, exc)
        except Exception:
            logger.exception("Error inesperado en iniciar-sesion del portal")
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        return Response(result, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class CapturarCorreoView(APIView):
    """POST /portal/auth/capturar-correo"""

    authentication_classes = []
    permission_classes = []
    throttle_classes = [PortalAuthRateThrottle]

    def post(self, request):
        serializer = CapturarCorreoSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            result = capturar_correo(
                serializer.validated_data["noExp"],
                serializer.validated_data["nombreCompleto"],
                serializer.validated_data["fechaNacimiento"],
                serializer.validated_data["correo"],
            )
        except PortalAuthError as exc:
            return _portal_error_response(request, exc)
        except Exception:
            logger.exception("Error inesperado en capturar-correo del portal")
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        return Response(result, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class VerificarCodigoView(APIView):
    """POST /portal/auth/verificar-codigo"""

    authentication_classes = []
    permission_classes = []
    throttle_classes = [PortalAuthRateThrottle]

    def post(self, request):
        serializer = VerificarCodigoSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            result = verificar_codigo(
                serializer.validated_data["noExp"],
                serializer.validated_data["nombreCompleto"],
                serializer.validated_data["fechaNacimiento"],
                serializer.validated_data["codigo"],
                ip_origen=request.META.get("REMOTE_ADDR"),
            )
        except PortalAuthError as exc:
            return _portal_error_response(request, exc)
        except Exception:
            logger.exception("Error inesperado en verificar-codigo del portal")
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        return Response(
            {
                "accessToken": result["accessToken"],
                "tokenType": "Bearer",
                "expiraEn": result["expiraEn"].isoformat(),
            },
            status=status.HTTP_200_OK,
        )


# ── Fase 3: núcleo familiar y disponibilidad ────────────────────────────────


class SlotsPortalQuerySerializer(serializers.Serializer):
    fecha = serializers.DateField(input_formats=["%Y-%m-%d"])
    # camelCase para seguir la convención de query params del resto del
    # proyecto (medicoId, fechaDesde, pageSize en CreateCitaSerializer de
    # apps.recepcion). ``especialidadId`` es opcional: sin filtro se listan
    # slots de todos los médicos (mismo comportamiento previo del eco de
    # servicioTipo, que nunca filtraba nada).
    especialidadId = serializers.IntegerField(required=False, min_value=1)


class NucleoView(APIView):
    """
    GET /portal/nucleo — pacientes que la sesión de portal autenticada
    puede ver y gestionar (ver reglas en ``services.nucleo_service``).
    """

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsPortalUser]

    def get(self, request):
        nucleo = obtener_nucleo(request.portal_miembro)
        return Response({"nucleo": nucleo})


class EspecialidadesPortalView(APIView):
    """
    GET /portal/especialidades — catálogo de especialidades disponible
    para armar el selector del frontend (filtro de ``GET /portal/slots``).
    Solo lectura, no expone nada sensible.
    """

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsPortalUser]

    def get(self, request):
        return Response({"especialidades": listar_especialidades()})


class SlotsPortalView(APIView):
    """GET /portal/slots?fecha=YYYY-MM-DD&especialidadId=..."""

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsPortalUser]

    def get(self, request):
        serializer = SlotsPortalQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Parámetros inválidos.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        slots = get_slots_portal(
            fecha=serializer.validated_data["fecha"],
            especialidad_id=serializer.validated_data.get("especialidadId"),
        )
        return Response({"slots": slots})


# ── Fase 4: reserva de cita / Fase 8: listado de citas ──────────────────────


@method_decorator(csrf_exempt, name="dispatch")
class ReservarCitaView(APIView):
    """
    POST /portal/citas — reserva un ``HorarioDisponible`` para un miembro
    del núcleo que la sesión actual puede gestionar (ver reglas en
    ``services.nucleo_service.puede_gestionar_miembro``).

    GET /portal/citas — (Fase 8, endpoint que faltó en las fases
    originales) lista las citas del núcleo familiar que la sesión actual
    puede gestionar (ver reglas en ``services.nucleo_service`` y
    ``uses_case.listar_citas_usecase``). Vive en la misma clase/ruta que el
    ``POST`` (mismo patrón que el resto de las vistas del portal, donde el
    verbo HTTP distingue la acción sobre el mismo recurso "citas" — no se
    agrega una ruta nueva en ``urls.py`` para no duplicar el path
    ``portal/citas``).

    ``csrf_exempt`` porque, igual que los endpoints de autenticación, el
    portal se autentica con Bearer token (no cookie de sesión) y nunca
    tendrá la cookie CSRF que ``CsrfViewMiddleware`` espera.
    """

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsPortalUser]

    def get(self, request):
        try:
            citas = listar_citas(request.portal_miembro)
        except Exception:
            logger.exception("Error inesperado al listar citas del portal")
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        return Response({"citas": citas})

    def post(self, request):
        serializer = ReservarCitaSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Datos inválidos.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            result = reservar_cita(
                request.portal_miembro,
                serializer.validated_data["miembroId"],
                serializer.validated_data["slotId"],
                motivo=serializer.validated_data.get("motivo") or None,
            )
        except PortalReservaError as exc:
            return _portal_error_response(request, exc)
        except Exception:
            logger.exception("Error inesperado al reservar cita del portal")
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        return Response(result, status=status.HTTP_201_CREATED)


# ── Fase 6: cancelación de cita ──────────────────────────────────────────────


@method_decorator(csrf_exempt, name="dispatch")
class CancelarCitaView(APIView):
    """
    PATCH /portal/citas/{folio}/cancelar — cancela una cita del portal a
    nombre de un miembro del núcleo que la sesión actual puede gestionar
    (ver reglas en ``services.nucleo_service.puede_gestionar_miembro``).

    ``csrf_exempt`` por el mismo motivo que ``ReservarCitaView``: el portal
    se autentica con Bearer token, nunca con cookie de sesión.
    """

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsPortalUser]

    def patch(self, request, folio):
        serializer = CancelarCitaSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Datos inválidos.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            result = cancelar_cita(
                request.portal_miembro,
                folio,
                motivo=serializer.validated_data.get("motivo") or None,
            )
        except PortalCancelacionError as exc:
            return _portal_error_response(request, exc)
        except Exception:
            logger.exception("Error inesperado al cancelar cita del portal")
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        return Response(result, status=status.HTTP_200_OK)
