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
    publish_visit_closed,
    publish_visit_diagnosis_saved,
    publish_visit_prescriptions_saved,
    publish_visit_status_changed,
)
from apps.recepcion.services.errors import VisitDomainError

from .serializers import (
    CloseConsultationSerializer,
    SaveDiagnosisSerializer,
    SavePrescriptionsSerializer,
    StartConsultationSerializer,
)
from .uses_case.consultation_usecase import (
    close_consultation,
    save_diagnosis,
    save_prescriptions,
    start_consultation,
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


def _csrf_or_error(request):
    if validate_csrf(request):
        return None
    return error_response(
        "PERMISSION_DENIED",
        "No tienes permiso para esta accion",
        status.HTTP_403_FORBIDDEN,
        request_id=get_request_id(request),
    )


def _domain_error_response(request, exc):
    return error_response(
        exc.code,
        exc.message,
        exc.status_code,
        details=exc.details,
        request_id=get_request_id(request),
    )


def _actor_context(user):
    auth_user = UserRepository.build_auth_user(user)
    return (
        user.id_usuario,
        auth_user.get("roles", []),
        auth_user.get("permissions", []),
    )


def _emit_visit_status_changed_event(request, *, visit_id, status):
    request_id = get_request_id(request)

    try:
        publish_visit_status_changed(
            visit_id=visit_id,
            status=status,
            request_id=request_id,
            correlation_id=request_id,
        )
    except Exception:
        logger.exception(
            "No se pudo publicar evento realtime de inicio de consulta",
            extra={"visit_id": visit_id, "status": status, "request_id": request_id},
        )


def _emit_visit_closed_event(request, *, visit_id):
    request_id = get_request_id(request)

    try:
        publish_visit_closed(
            visit_id=visit_id,
            request_id=request_id,
            correlation_id=request_id,
        )
    except Exception:
        logger.exception(
            "No se pudo publicar evento realtime de cierre de consulta",
            extra={"visit_id": visit_id, "request_id": request_id},
        )


def _emit_visit_diagnosis_saved_event(
    request,
    *,
    visit_id,
    status,
    primary_diagnosis,
    final_note,
):
    request_id = get_request_id(request)

    try:
        publish_visit_diagnosis_saved(
            visit_id=visit_id,
            status=status,
            primary_diagnosis=primary_diagnosis,
            final_note=final_note,
            request_id=request_id,
            correlation_id=request_id,
        )
    except Exception:
        logger.exception(
            "No se pudo publicar evento realtime de diagnostico",
            extra={"visit_id": visit_id, "request_id": request_id},
        )


def _emit_visit_prescriptions_saved_event(
    request,
    *,
    visit_id,
    status,
    items,
):
    request_id = get_request_id(request)

    try:
        publish_visit_prescriptions_saved(
            visit_id=visit_id,
            status=status,
            items=items,
            request_id=request_id,
            correlation_id=request_id,
        )
    except Exception:
        logger.exception(
            "No se pudo publicar evento realtime de receta",
            extra={"visit_id": visit_id, "request_id": request_id},
        )


@method_decorator(csrf_exempt, name="dispatch")
class VisitConsultationStartView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, visit_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        serializer = StartConsultationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        actor_id, roles, permissions = _actor_context(user)

        try:
            payload = start_consultation(visit_id, roles, permissions)
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        log_event(
            request,
            "ConsultationStarted",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "consulta_medica",
                "endpoint": request.path,
                "visitId": payload.get("id"),
                "actorId": actor_id,
            },
        )

        _emit_visit_status_changed_event(
            request,
            visit_id=payload.get("id"),
            status=payload.get("status"),
        )

        return Response(payload, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class VisitDiagnosisSaveView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, visit_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        serializer = SaveDiagnosisSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        actor_id, roles, permissions = _actor_context(user)

        try:
            payload = save_diagnosis(
                visit_id,
                roles,
                serializer.validated_data["primaryDiagnosis"],
                serializer.validated_data["finalNote"],
                actor_id,
                permissions,
            )
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        log_event(
            request,
            "DiagnosisSaved",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "consulta_medica",
                "endpoint": request.path,
                "visitId": payload.get("visitId"),
                "actorId": actor_id,
            },
        )

        _emit_visit_diagnosis_saved_event(
            request,
            visit_id=payload.get("visitId"),
            status=payload.get("status"),
            primary_diagnosis=payload.get("primaryDiagnosis"),
            final_note=payload.get("finalNote"),
        )

        return Response(payload, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class VisitPrescriptionsSaveView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, visit_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        serializer = SavePrescriptionsSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        actor_id, roles, permissions = _actor_context(user)

        try:
            payload = save_prescriptions(
                visit_id,
                roles,
                serializer.validated_data["items"],
                actor_id,
                permissions,
            )
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        log_event(
            request,
            "PrescriptionsSaved",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "consulta_medica",
                "endpoint": request.path,
                "visitId": payload.get("visitId"),
                "actorId": actor_id,
            },
        )

        _emit_visit_prescriptions_saved_event(
            request,
            visit_id=payload.get("visitId"),
            status=payload.get("status"),
            items=payload.get("items") or [],
        )

        return Response(payload, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class VisitConsultationCloseView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, visit_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        serializer = CloseConsultationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        actor_id, roles, permissions = _actor_context(user)

        try:
            validated_data = dict(serializer.validated_data)
            primary_diagnosis = validated_data.get("primaryDiagnosis", "")
            final_note = validated_data.get("finalNote", "")
            payload = close_consultation(
                visit_id,
                roles,
                primary_diagnosis,
                final_note,
                actor_id,
                permissions,
            )
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        visit_payload = payload.get("visit", {})

        log_event(
            request,
            "ConsultationClosed",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "consulta_medica",
                "endpoint": request.path,
                "visitId": visit_payload.get("id"),
                "actorId": actor_id,
            },
        )

        _emit_visit_closed_event(
            request,
            visit_id=visit_payload.get("id"),
        )

        return Response(payload, status=status.HTTP_200_OK)
