from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.session_service import authenticate_request

from ..use_cases.expedientes.buscar_expediente import buscar_expediente
from ..use_cases.expedientes.actualizar_expediente import actualizar_expediente


class ExpedienteView(APIView):
    """GET /api/expedientes/?id_empleado=<no>"""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            authenticate_request(request)
        except AuthServiceError as exc:
            return Response({"code": exc.code, "message": exc.message}, status=exc.status_code)

        id_empleado = request.query_params.get("id_empleado", "").strip()

        if not id_empleado:
            return Response(
                {"error": "Se requiere el parámetro id_empleado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resultado = buscar_expediente(id_empleado)

        if not resultado["empleados"]:
            return Response(
                {"error": f"No se encontró el expediente {id_empleado}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(resultado, status=status.HTTP_200_OK)


class ActualizarExpedienteView(APIView):
    """POST /api/administracion/expedientes/actualizar/"""

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        try:
            authenticate_request(request)
        except AuthServiceError as exc:
            return Response({"code": exc.code, "message": exc.message}, status=exc.status_code)

        expediente = request.data.get("expediente", "").strip()

        if not expediente:
            return Response(
                {"error": "Se requiere el campo expediente en el body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resultado = actualizar_expediente(expediente)
        return Response(resultado, status=status.HTTP_200_OK)
