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
from apps.somatometria.serializers import CaptureVitalsSerializer
from apps.somatometria.services.visit_flow_service import (
    VisitFlowError,
    get_visit_flow_service,
)
from apps.somatometria.uses_case.capture_vitals_usecase import (
    capture_vitals,
    ensure_somatometria_role,
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


def _require_somatometria_role(user):
    auth_user = UserRepository.build_auth_user(user)
    ensure_somatometria_role(
        auth_user.get("roles", []),
        auth_user.get("permissions", []),
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
            },
        )

        _emit_visit_status_changed_event(
            request,
            visit_id=result.get("visitId"),
            status=result.get("status"),
            previous_status=previous_status,
        )

        return Response(result, status=status.HTTP_200_OK)
