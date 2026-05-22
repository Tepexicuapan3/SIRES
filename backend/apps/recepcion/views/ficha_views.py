"""
Endpoint para generar la Ficha de Consulta en PDF.
GET /api/v1/visits/{visit_id}/ficha
"""

import logging

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView

from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request
from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.services.ficha_service import generate_ficha_pdf

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class FichaVisitView(APIView):
    """
    GET /visits/{visit_id}/ficha
    Descarga la ficha de consulta en PDF para la visita indicada.
    """

    authentication_classes = []
    permission_classes     = []

    def get(self, request, visit_id):
        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            return error_response(
                exc.code, exc.message, exc.status_code,
                request_id=get_request_id(request),
            )

        visit = VisitRepository.get_by_id(visit_id)
        if not visit:
            return error_response(
                "VISIT_NOT_FOUND", "Visita no encontrada.", 404,
                request_id=get_request_id(request),
            )

        # Obtener nombre del usuario que genera la ficha
        try:
            from apps.authentication.models import DetUsuario
            det = DetUsuario.objects.filter(id_usuario=user.id_usuario).first()
            usuario_nombre = det.nombre_completo if det else str(user)
        except Exception:
            usuario_nombre = ""

        try:
            pdf_bytes = generate_ficha_pdf(visit, usuario_nombre=usuario_nombre)
        except Exception:
            logger.exception("Error generando ficha PDF para visita %s", visit_id)
            return error_response(
                "FICHA_ERROR",
                "No se pudo generar la ficha. Verifica que Microsoft Word esté instalado en el servidor.",
                500,
                request_id=get_request_id(request),
            )

        filename = f"ficha_{visit.folio}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        return response
