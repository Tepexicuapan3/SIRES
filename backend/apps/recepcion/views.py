import logging

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.audit_service import log_event
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request
from apps.realtime.events import (
    publish_visit_cancelled,
    publish_visit_created,
    publish_visit_no_show,
    publish_visit_status_changed,
)
from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.serializers import (
    CreateVisitSerializer,
    ListVisitsQuerySerializer,
    UpdateVisitStatusSerializer,
)
from apps.recepcion.services.errors import VisitDomainError
from apps.recepcion.uses_case.visit_queue_usecase import (
    change_visit_status,
    create_visit,
    ensure_recepcion_role,
    ensure_visit_queue_access,
    list_visits,
)

logger = logging.getLogger(__name__)


def _auth_or_error(request):
    try:
        return authenticate_request(request), None
    except AuthServiceError as exc:
        return None, error_response(
            exc.code,
            exc.message,
            exc.status_code,
            details=exc.details,
            request_id=get_request_id(request),
        )


def _require_recepcion_role(user):
    auth_user = UserRepository.build_auth_user(user)
    ensure_recepcion_role(
        auth_user.get("roles", []),
        auth_user.get("permissions", []),
    )


def _require_visit_queue_access(user):
    auth_user = UserRepository.build_auth_user(user)
    ensure_visit_queue_access(
        auth_user.get("roles", []),
        auth_user.get("permissions", []),
    )


def _csrf_or_error(request):
    # Mutating endpoints require custom CSRF header/cookie match.
    if validate_csrf(request):
        return None
    return error_response(
        "PERMISSION_DENIED",
        "No tienes permiso para esta accion",
        status.HTTP_403_FORBIDDEN,
        request_id=get_request_id(request),
    )


def _emit_visit_status_changed_event(request, *, visit_id, status, previous_status=None):
    request_id = get_request_id(request)

    try:
        publish_visit_status_changed(
            visit_id=visit_id,
            status=status,
            previous_status=previous_status,
            request_id=request_id,
            correlation_id=request_id,
        )
    except Exception:
        logger.exception(
            "No se pudo publicar evento realtime de visita",
            extra={"visit_id": visit_id, "status": status, "request_id": request_id},
        )


def _emit_visit_created_event(request, *, visit_id, status):
    request_id = get_request_id(request)

    try:
        publish_visit_created(
            visit_id=visit_id,
            status=status,
            request_id=request_id,
            correlation_id=request_id,
        )
    except Exception:
        logger.exception(
            "No se pudo publicar evento realtime de creacion de visita",
            extra={"visit_id": visit_id, "status": status, "request_id": request_id},
        )


def _emit_visit_cancelled_event(request, *, visit_id, status, previous_status=None):
    request_id = get_request_id(request)

    try:
        publish_visit_cancelled(
            visit_id=visit_id,
            status=status,
            previous_status=previous_status,
            request_id=request_id,
            correlation_id=request_id,
        )
    except Exception:
        logger.exception(
            "No se pudo publicar evento realtime de cancelacion de visita",
            extra={"visit_id": visit_id, "status": status, "request_id": request_id},
        )


def _emit_visit_no_show_event(request, *, visit_id, status, previous_status=None):
    request_id = get_request_id(request)

    try:
        publish_visit_no_show(
            visit_id=visit_id,
            status=status,
            previous_status=previous_status,
            request_id=request_id,
            correlation_id=request_id,
        )
    except Exception:
        logger.exception(
            "No se pudo publicar evento realtime de no show de visita",
            extra={"visit_id": visit_id, "status": status, "request_id": request_id},
        )


@method_decorator(csrf_exempt, name="dispatch")
class VisitsView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        try:
            _require_recepcion_role(user)
        except VisitDomainError as exc:
            return _visit_error_response(request, exc)

        serializer = CreateVisitSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            visit = create_visit(
                patient_id=serializer.validated_data["patientId"],
                arrival_type=serializer.validated_data["arrivalType"],
                service_type=serializer.validated_data.get("serviceType"),
                appointment_id=serializer.validated_data.get("appointmentId"),
                doctor_id=serializer.validated_data.get("doctorId"),
                notes=serializer.validated_data.get("notes"),
            )
        except VisitDomainError as exc:
            return _visit_error_response(request, exc)
        log_event(
            request,
            "VisitCreated",
            "SUCCESS",
            actor_user=user,
            meta={"module": "recepcion", "endpoint": request.path, "visitId": visit.get("id")},
        )
        _emit_visit_status_changed_event(
            request,
            visit_id=visit.get("id"),
            status=visit.get("status"),
        )
        _emit_visit_created_event(
            request,
            visit_id=visit.get("id"),
            status=visit.get("status"),
        )
        return Response(visit, status=status.HTTP_201_CREATED)

    def get(self, request):
        user, error = _auth_or_error(request)
        if error:
            return error

        try:
            _require_visit_queue_access(user)
        except VisitDomainError as exc:
            return _visit_error_response(request, exc)

        serializer = ListVisitsQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Parametros de paginacion invalidos",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        payload = list_visits(
            page=serializer.validated_data["page"],
            page_size=serializer.validated_data["pageSize"],
            status_filter=serializer.validated_data.get("status"),
            date_filter=serializer.validated_data.get("date"),
            doctor_id=serializer.validated_data.get("doctorId"),
            service_type=serializer.validated_data.get("serviceType"),
        )
        return Response(payload, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class VisitStatusView(APIView):
    authentication_classes = []
    permission_classes = []

    def patch(self, request, visit_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        try:
            _require_recepcion_role(user)
        except VisitDomainError as exc:
            return _visit_error_response(request, exc)

        serializer = UpdateVisitStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            target_status = serializer.validated_data["targetStatus"]
            previous_status = None
            current_visit = VisitRepository.get_by_id(visit_id)
            if current_visit is not None:
                previous_status = current_visit.status
            visit = change_visit_status(visit_id, target_status)
        except VisitDomainError as exc:
            return _visit_error_response(request, exc)

        log_event(
            request,
            "VisitStatusChanged",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "recepcion",
                "endpoint": request.path,
                "visitId": visit.get("id"),
                "targetStatus": target_status,
            },
        )
        if target_status == "cancelada":
            log_event(
                request,
                "VisitCancelled",
                "SUCCESS",
                actor_user=user,
                meta={"module": "recepcion", "endpoint": request.path, "visitId": visit.get("id")},
            )
            _emit_visit_cancelled_event(
                request,
                visit_id=visit.get("id"),
                status=visit.get("status"),
                previous_status=previous_status,
            )
        if target_status == "no_show":
            log_event(
                request,
                "VisitNoShow",
                "SUCCESS",
                actor_user=user,
                meta={"module": "recepcion", "endpoint": request.path, "visitId": visit.get("id")},
            )
            _emit_visit_no_show_event(
                request,
                visit_id=visit.get("id"),
                status=visit.get("status"),
                previous_status=previous_status,
            )

        _emit_visit_status_changed_event(
            request,
            visit_id=visit.get("id"),
            status=visit.get("status"),
            previous_status=previous_status,
        )

        return Response(visit, status=status.HTTP_200_OK)


def _visit_error_response(request, exc):
    return error_response(
        exc.code,
        exc.message,
        exc.status_code,
        details=exc.details,
        request_id=get_request_id(request),
    )



#############################  VIEWS DEL MÓDULO DE CITAS EN LÍNEA  ###################################################################################
"""
apps/recepcion/views.py
=======================
Sección de Citas Médicas para el módulo de recepción.
"""

from datetime import date, timedelta

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from .models import CitaMedica, CitaNotificacion
from .repositories.paciente_repository import PacienteRepository
from .repositories.citas_repository import CitasRepository
from .uses_case.citas_usecase import CitasMedicaUseCase
from .serializers import (
    CrearCitaSerializer,
    CitaMedicaSerializer,
    FiltrosCitasSerializer,
    CancelarCitaSerializer,
    NucleoFamiliarSerializer,
    PacienteSerializer,
    SlotDisponibilidadSerializer,
)
from .services.pdf_service import generar_pdf_cita


paciente_repo = PacienteRepository()
citas_repo = CitasRepository()
citas_uc = CitasMedicaUseCase()


# ============================================================================
# NÚCLEO FAMILIAR
# ============================================================================

class NucleoFamiliarView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    """
    GET /api/v1/recepcion/citas/nucleo-familiar/{no_exp}/
    Retorna el trabajador y sus derechohabientes separados, cada uno con foto.
    """

    def get(self, request, no_exp: int):
        nucleo = paciente_repo.get_nucleo_familiar(no_exp)
        if not nucleo["trabajador"]:
            return Response(
                {"detail": f"No se encontró el expediente {no_exp}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = NucleoFamiliarSerializer(nucleo)
        return Response(serializer.data)


class BuscarEmpleadosView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    """
    GET /api/v1/recepcion/citas/buscar-empleados/?q=<texto>
    Mínimo 2 caracteres. Máximo 15 resultados. Sin foto para agilizar.
    """

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response([])

        resultado = paciente_repo.buscar_empleados(q, limit=15)
        serializer = PacienteSerializer(resultado, many=True)
        return Response(serializer.data)


# ============================================================================
# DISPONIBILIDAD
# ============================================================================

class DisponibilidadView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    """
    GET /api/v1/recepcion/citas/disponibilidad/
    Params:
    - medico_id (requerido)
    - fecha_inicio (opcional, YYYY-MM-DD)
    - fecha_fin (opcional, YYYY-MM-DD)
    """

    def get(self, request):
        medico_id = request.query_params.get("medico_id")
        if not medico_id:
            return Response(
                {"detail": "medico_id es requerido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            medico_id = int(medico_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": "medico_id inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hoy = timezone.localdate()
        fecha_inicio = _parse_date(request.query_params.get("fecha_inicio"), hoy)
        fecha_fin = _parse_date(
            request.query_params.get("fecha_fin"),
            hoy + timedelta(days=30),
        )

        try:
            slots = citas_repo.get_disponibilidad(
                medico_id=medico_id,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # get_disponibilidad regresa dicts, no instancias; se responde directo
        return Response(slots)


# ============================================================================
# CRUD DE CITAS
# ============================================================================

class CitasViewSet(ViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]

    """
    Endpoints:
      POST   /citas/                -> create
      GET    /citas/                -> list
      GET    /citas/{id}/           -> retrieve
      POST   /citas/{id}/cancelar/  -> cancelar
      GET    /citas/{id}/pdf/       -> pdf
    """

    def create(self, request):
        serializer = CrearCitaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario_id = None
        if getattr(request, "user", None) and request.user.is_authenticated:
            usuario_id = getattr(request.user, "id_usuario", None) or getattr(request.user, "id", None)

        try:
            cita = citas_uc.crear_cita(
                datos=serializer.validated_data,
                usuario_id=usuario_id,
            )
        except ValueError as exc:
            mensaje = str(exc).lower()
            http_status = (
                status.HTTP_409_CONFLICT
                if (
                    "disponible" in mensaje
                    or "ocupado" in mensaje
                    or "conflicto" in mensaje
                    or "ya tiene una cita" in mensaje
                )
                else status.HTTP_400_BAD_REQUEST
            )
            return Response({"detail": str(exc)}, status=http_status)

        return Response(
            CitaMedicaSerializer(cita).data,
            status=status.HTTP_201_CREATED,
        )

    def list(self, request):
        serializer = FiltrosCitasSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        filtros = serializer.validated_data

        resultado = citas_repo.listar_citas(
            fecha=filtros.get("fecha"),
            centro_atencion_id=filtros.get("centro_atencion_id"),
            medico_id=filtros.get("medico_id"),
            estatus=filtros.get("estatus"),
            no_exp=filtros.get("no_exp"),
            busqueda=filtros.get("busqueda"),
            page=filtros.get("page", 1),
            page_size=filtros.get("page_size", 30),
        )
        resultado["results"] = CitaMedicaSerializer(
            resultado["results"],
            many=True,
        ).data
        return Response(resultado)

    def retrieve(self, request, pk=None):
        cita = get_object_or_404(CitaMedica, id=pk)
        return Response(CitaMedicaSerializer(cita).data)

    @action(detail=True, methods=["post"])
    def cancelar(self, request, pk=None):
        serializer = CancelarCitaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cita = citas_uc.cancelar_cita(
                cita_id=pk,
                motivo=serializer.validated_data.get("motivo", ""),
                enviar_correo=serializer.validated_data.get("enviar_correo", True),
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(CitaMedicaSerializer(cita).data)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        cita = get_object_or_404(CitaMedica, id=pk)

        cita_data = {
            "id": str(cita.id),
            "tipo_paciente": cita.tipo_paciente,
            "no_exp": cita.no_exp,
            "pk_num": cita.pk_num,
            "nombre_paciente": cita.nombre_paciente,
            "nombre_medico": cita.nombre_medico,
            "nombre_centro": cita.nombre_centro,
            "nombre_consult": cita.nombre_consult,
            "fecha_hora": cita.fecha_hora.isoformat(),
            "estatus": cita.get_estatus_display(),
            "motivo": cita.motivo,
        }

        pdf_bytes = generar_pdf_cita(
            cita_data,
            logo_path=getattr(settings, "CITAS_LOGO_PATH", None),
        )

        return HttpResponse(
            pdf_bytes,
            content_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="cita_{str(cita.id)[:8]}.pdf"',
            },
        )


# ============================================================================
# ACCIONES DESDE TOKEN DE CORREO
# ============================================================================

class AccionTokenView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    """
    GET /api/v1/recepcion/citas/accion/{token}/confirmar/
    GET /api/v1/recepcion/citas/accion/{token}/cancelar/
    """

    def get(self, request, token, accion):
        try:
            notif = CitaNotificacion.objects.select_related("cita").get(token=token)
        except CitaNotificacion.DoesNotExist:
            return Response(
                {"detail": "Enlace inválido."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if notif.token_usado:
            return Response(
                {"detail": "Este enlace ya fue utilizado."},
                status=status.HTTP_410_GONE,
            )

        if notif.token_expira and notif.token_expira < timezone.now():
            return Response(
                {"detail": "Este enlace ha expirado."},
                status=status.HTTP_410_GONE,
            )

        cita = notif.cita

        try:
            if accion == "confirmar":
                cita = citas_uc.confirmar_desde_token(cita.id)
                mensaje = "Su asistencia ha sido confirmada. Le esperamos."

            elif accion == "cancelar":
                cita = citas_uc.cancelar_cita(
                    cita_id=cita.id,
                    motivo="Cancelado por el paciente desde correo.",
                    enviar_correo=False,
                )
                mensaje = "Su cita ha sido cancelada correctamente."

            else:
                return Response(
                    {"detail": "Acción inválida."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notif.token_usado = True
        notif.save(update_fields=["token_usado"])

        return Response(
            {
                "mensaje": mensaje,
                "cita": CitaMedicaSerializer(cita).data,
            }
        )


# ============================================================================
# HELPERS
# ============================================================================

def _parse_date(value, default: date) -> date:
    if not value:
        return default
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return default