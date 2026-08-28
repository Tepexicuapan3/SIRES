"""
apps/comunicados/views.py
============================
Endpoints CRUD del módulo Comunicados (`/api/v1/comunicados/anuncios`).

``ErrorMixin`` se COPIA acá (no se importa de ``apps.catalogos.views``):
ese módulo arrastra ~1600 líneas y ~100 serializers solo para reusar 13
líneas. ``HasCatalogPermission``/``CatalogApiException`` sí se importan de
``apps.catalogos.permissions`` (módulo liviano y ya transversal al
proyecto) -- ver ``ComunicadosPermissionMixin``.

``_PaginationMixin`` es la misma copia acotada: reproduce
``catalogos/views.py:PaginationMixin`` (parseo de ``page``/``pageSize`` +
envelope ``{items,page,pageSize,total,totalPages}``) sin importar ese
módulo. El resto del envelope (detalle/create/update envueltos en
``{"anuncio": ...}``, delete devolviendo ``{"success": true}``) sigue el
mismo contrato que ``CatalogBaseDetailView``/``CatalogBaseListCreateView.delete``
-- es el contrato real que ya consume el frontend (``ListResponse``,
``SuccessResponse`` en ``@api/types/common.types``).
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.comunicados.errors import ComunicadoError
from apps.comunicados.permissions import ComunicadosPermissionMixin
from apps.comunicados.repositories.anuncio_repository import AnuncioRepository
from apps.comunicados.serializers import (
    AnuncioDetailSerializer,
    AnuncioListSerializer,
    AnuncioWriteSerializer,
)
from apps.comunicados.uses_case.actualizar_anuncio_use_case import actualizar_anuncio
from apps.comunicados.uses_case.crear_anuncio_use_case import crear_anuncio
from apps.comunicados.uses_case.eliminar_anuncio_use_case import eliminar_anuncio


def _get_actor_id(user):
    return getattr(user, "id_usuario", None) or getattr(user, "id", None)


class ErrorMixin:
    def _error(self, request, *, code, message, http_status, details=None):
        return Response(
            {
                "code": code,
                "message": message,
                "status": http_status,
                "details": details or {},
                "requestId": request.headers.get("X-Request-ID"),
                "timestamp": timezone.now().isoformat().replace("+00:00", "Z"),
            },
            status=http_status,
        )


class _PaginationError(Exception):
    """Transporta un Response de error de paginación ya construido."""

    def __init__(self, response):
        self.response = response


class _PaginationMixin:
    """Parsea ``page``/``pageSize`` y arma el envelope ``ListResponse``."""

    def _parse_pagination(self, request):
        try:
            page = int(request.query_params.get("page", "1"))
            page_size = int(request.query_params.get("pageSize", "20"))
        except (TypeError, ValueError):
            raise _PaginationError(
                self._error(
                    request,
                    code="INVALID_FORMAT",
                    message="Parámetros de paginación inválidos",
                    http_status=status.HTTP_400_BAD_REQUEST,
                    details={
                        "page": ["Debe ser un entero"],
                        "pageSize": ["Debe ser un entero"],
                    },
                )
            )

        if page < 1 or page_size < 1 or page_size > 500:
            raise _PaginationError(
                self._error(
                    request,
                    code="VALIDATION_ERROR",
                    message="Parámetros de paginación fuera de rango",
                    http_status=status.HTTP_400_BAD_REQUEST,
                    details={
                        "page": ["Debe ser mayor o igual a 1"],
                        "pageSize": ["Debe estar entre 1 y 500"],
                    },
                )
            )

        return page, page_size

    @staticmethod
    def _paginate_queryset(qs, page, page_size):
        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start : start + page_size]
        total_pages = (total + page_size - 1) // page_size
        return items, total, total_pages

    @staticmethod
    def _paginated_response(serializer_data, page, page_size, total, total_pages):
        return Response(
            {
                "items": serializer_data,
                "page": page,
                "pageSize": page_size,
                "total": total,
                "totalPages": total_pages,
            },
            status=status.HTTP_200_OK,
        )


class AnunciosListCreateView(ComunicadosPermissionMixin, _PaginationMixin, ErrorMixin, APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        try:
            page, page_size = self._parse_pagination(request)
        except _PaginationError as exc:
            return exc.response

        filtros = {}
        activo_raw = request.query_params.get("activo")
        if activo_raw is not None:
            filtros["activo"] = activo_raw.lower() == "true"

        anuncios = AnuncioRepository.list_admin(filtros)
        items, total, total_pages = self._paginate_queryset(anuncios, page, page_size)
        serializer = AnuncioListSerializer(items, many=True)
        return self._paginated_response(serializer.data, page, page_size, total, total_pages)

    def post(self, request):
        serializer = AnuncioWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        anuncio = crear_anuncio(
            serializer.validated_data, actor_id=_get_actor_id(request.user)
        )
        return Response(
            {"anuncio": AnuncioDetailSerializer(anuncio).data},
            status=status.HTTP_201_CREATED,
        )


class AnuncioDetailView(ComunicadosPermissionMixin, ErrorMixin, APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, anuncio_id):
        anuncio = AnuncioRepository.get_by_id(anuncio_id)
        if anuncio is None:
            return self._error(
                request,
                code="ANUNCIO_NOT_FOUND",
                message="El anuncio no existe",
                http_status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"anuncio": AnuncioDetailSerializer(anuncio).data})

    def patch(self, request, anuncio_id):
        anuncio = AnuncioRepository.get_by_id(anuncio_id)
        if anuncio is None:
            return self._error(
                request,
                code="ANUNCIO_NOT_FOUND",
                message="El anuncio no existe",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AnuncioWriteSerializer(anuncio, data=request.data, partial=True)
        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        try:
            actualizado = actualizar_anuncio(anuncio_id, serializer.validated_data)
        except ComunicadoError as exc:
            return self._error(
                request,
                code=exc.code,
                message=exc.message,
                http_status=exc.status_code,
                details=exc.details,
            )

        return Response({"anuncio": AnuncioDetailSerializer(actualizado).data})

    def delete(self, request, anuncio_id):
        try:
            eliminar_anuncio(anuncio_id)
        except ComunicadoError as exc:
            return self._error(
                request,
                code=exc.code,
                message=exc.message,
                http_status=exc.status_code,
                details=exc.details,
            )

        return Response({"success": True})
