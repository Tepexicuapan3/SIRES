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
    list_visits,
)


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
    ensure_recepcion_role(auth_user.get("roles", []))


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
        return Response(visit, status=status.HTTP_201_CREATED)

    def get(self, request):
        user, error = _auth_or_error(request)
        if error:
            return error

        try:
            _require_recepcion_role(user)
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
        if target_status == "no_show":
            log_event(
                request,
                "VisitNoShow",
                "SUCCESS",
                actor_user=user,
                meta={"module": "recepcion", "endpoint": request.path, "visitId": visit.get("id")},
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

