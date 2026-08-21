from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.administracion.views.rbac_views import _authorize

from ..use_cases.expedientes.buscar_expediente import buscar_expediente, buscar_por_nombre
from ..use_cases.expedientes.actualizar_expediente import actualizar_expediente

# Único permiso RBAC definido para el módulo de expedientes administrativos
# (ver frontend/src/app/navigation/nav-config.ts y navigation_seed.py:
# "administracion.panel.expedientes" gatea ver, actualizar y buscar por
# nombre con este mismo código — no existe un código separado de escritura).
PERMISO_EXPEDIENTES = "admin:gestion:expedientes:read"


class ExpedienteView(APIView):
    """GET /api/expedientes/?id_empleado=<no>"""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        _, auth_error = _authorize(request, PERMISO_EXPEDIENTES)
        if auth_error:
            return auth_error

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
        _, auth_error = _authorize(request, PERMISO_EXPEDIENTES, require_csrf=True)
        if auth_error:
            return auth_error

        expediente = request.data.get("expediente", "").strip()

        if not expediente:
            return Response(
                {"error": "Se requiere el campo expediente en el body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resultado = actualizar_expediente(expediente)
        return Response(resultado, status=status.HTTP_200_OK)


class BuscarPorNombreView(APIView):
    """GET /api/administracion/expedientes/buscar-nombre/?nombre=<texto>"""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        _, auth_error = _authorize(request, PERMISO_EXPEDIENTES)
        if auth_error:
            return auth_error

        nombre = request.query_params.get("nombre", "").strip()

        if len(nombre) < 3:
            return Response(
                {"error": "El parámetro nombre debe tener al menos 3 caracteres."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resultados = buscar_por_nombre(nombre)
        return Response(resultados, status=status.HTTP_200_OK)
