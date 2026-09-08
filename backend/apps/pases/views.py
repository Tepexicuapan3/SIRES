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
from apps.recepcion.services.errors import VisitDomainError

from .serializers import CancelReferralSerializer, CreateReferralSerializer
from .uses_case.referral_usecase import (
    cancel_referral,
    create_referral,
    get_patient_referrals,
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


def _parse_pk_num(request):
    raw_value = request.query_params.get("pkNum", "0")
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return None


@method_decorator(csrf_exempt, name="dispatch")
class VisitReferralCreateView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, visit_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        serializer = CreateReferralSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        actor_id, roles, permissions = _actor_context(user)
        data = serializer.validated_data

        try:
            payload = create_referral(
                visit_id,
                roles,
                referral_type=data["referralType"],
                destination_center_id=data.get("destinationCenterId"),
                specialty_id=data.get("specialtyId"),
                requested_care=data.get("requestedCare"),
                visit_type=data.get("visitType"),
                studies=data.get("studies"),
                actor_id=actor_id,
                permissions=permissions,
            )
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        log_event(
            request,
            "ReferralCreated",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "pases",
                "endpoint": request.path,
                "visitId": visit_id,
                "referralType": data["referralType"],
                "actorId": actor_id,
            },
        )

        return Response(payload, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class ReferralCancelView(APIView):
    authentication_classes = []
    permission_classes = []

    def patch(self, request, referral_id):
        user, error = _auth_or_error(request)
        if error:
            return error

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            return csrf_error

        serializer = CancelReferralSerializer(data=request.data)
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
            payload = cancel_referral(
                referral_id,
                roles,
                cancellation_reason_id=serializer.validated_data["cancellationReasonId"],
                actor_id=actor_id,
                permissions=permissions,
            )
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        log_event(
            request,
            "ReferralCancelled",
            "SUCCESS",
            actor_user=user,
            meta={
                "module": "pases",
                "endpoint": request.path,
                "referralId": referral_id,
                "actorId": actor_id,
            },
        )

        return Response(payload, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class PatientReferralsHistoryView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, no_exp):
        user, error = _auth_or_error(request)
        if error:
            return error

        pk_num = _parse_pk_num(request)
        if pk_num is None:
            return error_response(
                "VALIDATION_ERROR",
                "Hay errores en el formulario",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                details={"pkNum": ["pkNum debe ser un numero entero."]},
                request_id=get_request_id(request),
            )

        _, roles, permissions = _actor_context(user)

        try:
            payload = get_patient_referrals(no_exp, pk_num, roles, permissions)
        except VisitDomainError as exc:
            return _domain_error_response(request, exc)

        return Response(payload, status=status.HTTP_200_OK)
