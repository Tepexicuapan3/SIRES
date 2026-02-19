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
from apps.recepcion.services.errors import VisitDomainError

from .serializers import CloseConsultationSerializer, StartConsultationSerializer
from .uses_case.consultation_usecase import close_consultation, start_consultation


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
    return user.id_usuario, auth_user.get("roles", [])


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

        actor_id, roles = _actor_context(user)

        try:
            payload = start_consultation(visit_id, roles)
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

        actor_id, roles = _actor_context(user)

        try:
            payload = close_consultation(
                visit_id,
                roles,
                serializer.validated_data["primaryDiagnosis"],
                serializer.validated_data["finalNote"],
                actor_id,
            )
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        log_event(
            request,
            "ConsultationClosed",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "consulta_medica",
                "endpoint": request.path,
                "visitId": payload["visit"].get("id"),
                "actorId": actor_id,
            },
        )

        return Response(payload, status=status.HTTP_200_OK)
