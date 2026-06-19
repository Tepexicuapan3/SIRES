from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.authentication.services.cookie_auth import CookieJWTAuthentication
from ..models.catalogos import Almacen, CatCategoriaInsumo, CatInsumo, CatProveedor, CatUnidadMedida
from ..serializers.catalogos import (
    AlmacenSerializer,
    CatCategoriaInsumoSerializer,
    CatInsumoSerializer,
    CatProveedorSerializer,
    CatUnidadMedidaSerializer,
)
from ._base import StandardListPagination


class CatUnidadMedidaViewSet(viewsets.ModelViewSet):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = CatUnidadMedidaSerializer
    pagination_class       = StandardListPagination
    filter_backends        = [filters.SearchFilter, filters.OrderingFilter]
    search_fields          = ["nombre", "abreviacion"]
    ordering_fields        = ["nombre", "abreviacion", "created_at"]
    ordering               = ["nombre"]

    def get_queryset(self):
        qs = CatUnidadMedida.objects.all()
        if not self.request.query_params.get("includeInactive"):
            qs = qs.filter(is_active=True)
        return qs


class CatCategoriaInsumoViewSet(viewsets.ModelViewSet):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = CatCategoriaInsumoSerializer
    pagination_class       = StandardListPagination
    filter_backends        = [filters.SearchFilter, filters.OrderingFilter]
    search_fields          = ["nombre", "descripcion"]
    ordering_fields        = ["nombre", "created_at"]
    ordering               = ["nombre"]

    def get_queryset(self):
        qs = CatCategoriaInsumo.objects.all()
        if not self.request.query_params.get("includeInactive"):
            qs = qs.filter(is_active=True)
        return qs


class CatProveedorViewSet(viewsets.ModelViewSet):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = CatProveedorSerializer
    pagination_class       = StandardListPagination
    filter_backends        = [filters.SearchFilter, filters.OrderingFilter]
    search_fields          = ["nombre", "contacto", "correo", "rfc"]
    ordering_fields        = ["nombre", "created_at"]
    ordering               = ["nombre"]

    def get_queryset(self):
        qs = CatProveedor.objects.all()
        if not self.request.query_params.get("includeInactive"):
            qs = qs.filter(is_active=True)
        return qs


class CatInsumoViewSet(viewsets.ModelViewSet):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = CatInsumoSerializer
    pagination_class       = StandardListPagination
    filter_backends        = [filters.SearchFilter, filters.OrderingFilter]
    search_fields          = ["nombre", "codigo", "codigo_barras", "descripcion"]
    ordering_fields        = ["nombre", "codigo", "created_at"]
    ordering               = ["nombre"]

    def get_queryset(self):
        qs     = CatInsumo.objects.select_related("id_categoria", "id_unidad").all()
        params = self.request.query_params

        if not params.get("includeInactive"):
            qs = qs.filter(is_active=True)

        if categoria_id := params.get("categoriaId"):
            qs = qs.filter(id_categoria_id=categoria_id)

        if params.get("requiereLote"):
            qs = qs.filter(requiere_lote=True)

        return qs


class AlmacenViewSet(viewsets.ModelViewSet):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = AlmacenSerializer
    pagination_class       = StandardListPagination
    filter_backends        = [filters.SearchFilter, filters.OrderingFilter]
    search_fields          = ["nombre", "descripcion"]
    ordering_fields        = ["nombre", "tipo", "created_at"]
    ordering               = ["nombre"]

    def get_queryset(self):
        qs     = Almacen.objects.select_related("id_centro_atencion").all()
        params = self.request.query_params

        if not params.get("includeInactive"):
            qs = qs.filter(is_active=True)

        if tipo := params.get("tipo"):
            qs = qs.filter(tipo=tipo)

        if centro_id := params.get("centroId"):
            qs = qs.filter(id_centro_atencion_id=centro_id)

        return qs
