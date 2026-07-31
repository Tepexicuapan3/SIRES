"""
Verificación de QR del comprobante de cita y confirmación de check-in — Fase 7
del módulo "Citas en Línea".

POST /citas/verificar-qr           → valida el payload firmado del QR y
                                       devuelve los datos de la ficha para
                                       que recepción confirme visualmente.
POST /citas/verificar-qr/confirmar → confirma el check-in: crea el Visit
                                       (reusando create_visit) y marca la
                                       cita como verificada.

Sigue el mismo patrón de autenticación/autorización que el resto de
``apps/recepcion`` (autenticación interna de staff vía cookie/JWT,
``authenticate_request`` + capabilities), NO ``PortalTokenAuthentication``
(esa es para el portal del paciente, este endpoint lo usa personal de
recepción logueado normalmente).
"""

import logging

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.audit_service import log_event
from apps.authentication.services.authorization_service import has_capability
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request
from apps.realtime.events import publish_visit_created, publish_visit_status_changed
from apps.recepcion.serializers import VerificarQRSerializer
from apps.recepcion.services.errors import VisitDomainError
from apps.recepcion.uses_case.qr_checkin_usecase import (
    CITAS_READ_CAPABILITY,
    RECEPCION_WRITE_CAPABILITY,
    confirmar_checkin,
    verificar_qr,
)

logger = logging.getLogger(__name__)


def _auth(request):
    try:
        return authenticate_request(request), None
    except AuthServiceError as exc:
        return None, error_response(
            exc.code, exc.message, exc.status_code,
            details=exc.details, request_id=get_request_id(request),
        )


def _csrf(request):
    if validate_csrf(request):
        return None
    return error_response(
        "PERMISSION_DENIED", "No tienes permiso para esta acción.",
        status.HTTP_403_FORBIDDEN, request_id=get_request_id(request),
    )


def _check_cap(user, capability):
    auth_user = UserRepository.build_auth_user(user)
    if not has_capability(auth_user.get("permissions", []), capability):
        raise VisitDomainError("ROLE_NOT_ALLOWED", "No tienes permiso.", 403)


def _domain_error(request, exc):
    return error_response(
        exc.code, exc.message, exc.status_code,
        details=exc.details, request_id=get_request_id(request),
    )


def _validate_body(request):
    s = VerificarQRSerializer(data=request.data)
    if not s.is_valid():
        return None, error_response(
            "VALIDATION_ERROR", "Datos inválidos.",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=s.errors, request_id=get_request_id(request),
        )
    return s.validated_data["payload"], None


@method_decorator(csrf_exempt, name="dispatch")
class VerificarQRView(APIView):
    """POST /citas/verificar-qr — valida el QR y muestra la ficha para confirmar."""

    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        user, err = _auth(request)
        if err:
            return err
        try:
            _check_cap(user, CITAS_READ_CAPABILITY)
        except VisitDomainError as exc:
            return _domain_error(request, exc)

        payload, err = _validate_body(request)
        if err:
            return err

        try:
            ficha = verificar_qr(payload)
        except VisitDomainError as exc:
            return _domain_error(request, exc)

        return Response(ficha, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class ConfirmarQRCheckinView(APIView):
    """POST /citas/verificar-qr/confirmar — confirma el check-in y crea la visita."""

    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        user, err = _auth(request)
        if err:
            return err
        csrf_err = _csrf(request)
        if csrf_err:
            return csrf_err
        try:
            _check_cap(user, RECEPCION_WRITE_CAPABILITY)
        except VisitDomainError as exc:
            return _domain_error(request, exc)

        payload, err = _validate_body(request)
        if err:
            return err

        try:
            resultado = confirmar_checkin(
                payload,
                verificado_por_id=getattr(user, "id_usuario", None),
            )
        except VisitDomainError as exc:
            return _domain_error(request, exc)

        visit = resultado["visit"]
        log_event(
            request, "VisitCreated", "SUCCESS", actor_user=user,
            meta={
                "module": "recepcion", "endpoint": request.path,
                "visitId": visit.get("id"), "origen": "qr_checkin",
                "folio": resultado.get("folio"),
            },
        )
        try:
            publish_visit_status_changed(
                visit_id=visit.get("id"), status=visit.get("status"),
                request_id=get_request_id(request), correlation_id=get_request_id(request),
            )
            publish_visit_created(
                visit_id=visit.get("id"), status=visit.get("status"),
                request_id=get_request_id(request), correlation_id=get_request_id(request),
            )
        except Exception:
            logger.exception(
                "No se pudo publicar evento realtime de check-in por QR",
                extra={"visitId": visit.get("id")},
            )

        return Response(resultado, status=status.HTTP_201_CREATED)
