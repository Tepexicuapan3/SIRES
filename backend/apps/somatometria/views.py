from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request
from apps.recepcion.services.errors import VisitDomainError
from apps.somatometria.serializers import CaptureVitalsSerializer
from apps.somatometria.uses_case.capture_vitals_usecase import (
    capture_vitals,
    ensure_somatometria_role,
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


@method_decorator(csrf_exempt, name="dispatch")
class VisitVitalsView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, visit_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        try:
            _require_somatometria_role(user)
        except VisitDomainError as exc:
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

        try:
            result = capture_vitals(visit_id, serializer.validated_data)
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        return Response(result, status=status.HTTP_200_OK)
