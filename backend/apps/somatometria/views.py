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
from apps.realtime.events import publish_visit_status_changed
from apps.somatometria.serializers import CaptureVitalsSerializer, EditVitalsSerializer
from apps.somatometria.services.visit_flow_service import (
    VisitFlowError,
    get_visit_flow_service,
)
from apps.somatometria.uses_case.capture_vitals_usecase import (
    SOMATOMETRIA_EDIT_CAPABILITY,
    capture_vitals,
    ensure_somatometria_capability,
    ensure_somatometria_role,
    get_latest_vitals_for_visit,
)
from apps.somatometria.uses_case.edit_vitals_usecase import edit_vitals

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


def _require_somatometria_role(user):
    auth_user = UserRepository.build_auth_user(user)
    ensure_somatometria_role(
        auth_user.get("roles", []),
        auth_user.get("permissions", []),
    )


def _require_somatometria_edit_capability(user):
    # D6/D7: la edicion auditada exige `flow.somatometria.edit`
    # (allOf clinico:somatometria:update), una capability SEPARADA y
    # ADITIVA de `flow.somatometria.capture` -- un usuario con captura
    # pero sin edicion sigue pudiendo capturar, nunca corregir.
    auth_user = UserRepository.build_auth_user(user)
    ensure_somatometria_capability(
        auth_user.get("permissions", []),
        SOMATOMETRIA_EDIT_CAPABILITY,
    )


def _domain_error_response(request, exc):
    return error_response(
        exc.code,
        exc.message,
        exc.status_code,
        details=exc.details,
        request_id=get_request_id(request),
    )


def _csrf_or_error(request):
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
            "No se pudo publicar evento realtime de somatometria",
            extra={"visit_id": visit_id, "status": status, "request_id": request_id},
        )


@method_decorator(csrf_exempt, name="dispatch")
class VisitVitalsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, visit_id):
        """
        `{"vitals": ..., "todayCapture": ...}` para la visita.

        `vitals` es la ultima captura de signos vitales del PACIENTE (no de
        la visita en si) -- la usa el formulario para precargar valores por
        default; `null` si el paciente nunca tuvo una captura previa.

        `todayCapture` es una captura YA tomada HOY (dia calendario local)
        a la misma persona en OTRA visita -- permite a la enfermera reusar
        signos vitales sin repetir la toma; `null` si no existe ninguna.
        """
        user, error = _auth_or_error(request)
        if error:
            return error

        try:
            _require_somatometria_role(user)
        except VisitFlowError as exc:
            return _domain_error_response(request, exc)

        try:
            result = get_latest_vitals_for_visit(visit_id)
        except VisitFlowError as exc:
            return _domain_error_response(request, exc)

        return Response(result, status=status.HTTP_200_OK)

    def post(self, request, visit_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        try:
            _require_somatometria_role(user)
        except VisitFlowError as exc:
            return _domain_error_response(request, exc)

        serializer = CaptureVitalsSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        previous_status = None
        visit_flow = get_visit_flow_service()
        current_visit = visit_flow.get_by_id(visit_id)
        if current_visit is not None:
            previous_status = current_visit.status

        try:
            result = capture_vitals(
                visit_id,
                serializer.validated_data,
                actor=user,
                visit_flow_service=visit_flow,
            )
        except VisitFlowError as exc:
            return _domain_error_response(request, exc)

        log_event(
            request,
            "VitalsCompleted",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "somatometria",
                "endpoint": request.path,
                "visitId": result.get("visitId"),
                "reusedFromVisitId": serializer.validated_data.get("reusedFromVisitId"),
            },
        )

        _emit_visit_status_changed_event(
            request,
            visit_id=result.get("visitId"),
            status=result.get("status"),
            previous_status=previous_status,
        )

        return Response(result, status=status.HTTP_200_OK)

    def patch(self, request, visit_id):
        """
        Edicion auditada de una captura YA existente (Fase 3, D8). NO crea
        fila nueva, NO cambia `status`, NO acepta `reusedFromVisitId`, y
        NO emite `visit_status_changed` -- es una correccion de la MISMA
        fila, no un paso mas del flujo de captura.
        """
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        try:
            _require_somatometria_edit_capability(user)
        except VisitFlowError as exc:
            return _domain_error_response(request, exc)

        serializer = EditVitalsSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        payload = dict(serializer.validated_data)
        motivo = payload.pop("motivo")

        def audit_hook(*, vitals_id, datos_antes, datos_despues):
            # D10: `raise_on_error=True` -- si esto falla, la excepcion se
            # propaga y `edit_vitals_usecase.edit_vitals` revierte todo el
            # `transaction.atomic()`, incluida la escritura de
            # `update_for_visit` que ya habia corrido antes del hook.
            log_event(
                request,
                "VitalsEdited",
                "SUCCESS",
                actor_user=user,
                resource_type="vitals",
                resource_id=vitals_id,
                datos_antes=datos_antes,
                datos_despues=datos_despues,
                meta={
                    "module": "somatometria",
                    "endpoint": request.path,
                    "visitId": visit_id,
                    "motivo": motivo,
                },
                raise_on_error=True,
            )

        try:
            result = edit_vitals(
                visit_id,
                payload,
                actor=user,
                audit_hook=audit_hook,
            )
        except VisitFlowError as exc:
            return _domain_error_response(request, exc)

        return Response(result, status=status.HTTP_200_OK)
