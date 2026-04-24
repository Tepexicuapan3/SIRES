from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalogos.permissions import HasCatalogPermission, CatalogApiException, MUTATING_METHODS
from apps.catalogos.views import PaginationMixin, ErrorMixin, _parse_bool_param, _PaginationError, _get_actor_id
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.session_service import authenticate_request

from .models import VacInventario
from .serializers import (
    VacInventarioListSerializer,
    VacInventarioDetailSerializer,
    VacInventarioCreateSerializer,
    VacInventarioUpdateSerializer,
)


class FarmaciaCatalogPermissionMixin:
    catalog = None

    _ACTION_MAP = {
        "GET": "read", "HEAD": "read", "OPTIONS": "read",
        "POST": "create", "PUT": "update", "PATCH": "update", "DELETE": "delete",
    }

    def get_permissions(self):
        request = getattr(self, "request", None)
        action = self._ACTION_MAP.get(request.method) if request else None
        if not action or not self.catalog:
            return []
        return [HasCatalogPermission(action=action, catalog=f"farmacia:{self.catalog}")]

    def _authenticate(self, request):
        request_id = request.headers.get("X-Request-ID")

        if request.method in MUTATING_METHODS and not validate_csrf(request):
            raise CatalogApiException(
                code="CSRF_INVALID",
                message="Token CSRF inválido o ausente",
                http_status=403,
                request_id=request_id,
            )

        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            raise CatalogApiException(
                code=exc.code,
                message=exc.message,
                http_status=exc.status_code,
                request_id=request_id,
                details=exc.details,
            )

        request.user = user
        return user

    def check_permissions(self, request):
        self._authenticate(request)
        for permission in self.get_permissions():
            if not permission.has_permission(request, self):
                pass


# ---------------------------------------------------------------------------
# Inventario de Vacunas - List + Create
# ---------------------------------------------------------------------------

class VacInventarioListCreateView(PaginationMixin, FarmaciaCatalogPermissionMixin, ErrorMixin, APIView):
    catalog = "vacunas"

    SORT_MAP = {
        "vaccine": "vaccine__name",
        "center": "center__name",
        "stockQuantity": "stock_quantity",
        "appliedDoses": "applied_doses",
        "isActive": "is_active",
    }

    def get(self, request):
        for perm in self.get_permissions():
            if not perm.has_permission(request, self):
                return self._error(request, code="INSUFFICIENT_PERMISSIONS",
                                   message="Sin permiso", http_status=403)

        try:
            page, page_size = self._parse_pagination(request)
        except _PaginationError as exc:
            return exc.response

        params = request.query_params
        sort_by = params.get("sortBy", "vaccine")
        sort_order = params.get("sortOrder", "asc")

        if sort_by not in self.SORT_MAP:
            return self._error(request, code="VALIDATION_ERROR",
                               message="sortBy inválido",
                               http_status=status.HTTP_400_BAD_REQUEST,
                               details={"sortBy": [f"Permitidos: {', '.join(self.SORT_MAP)}"]})

        if sort_order not in ("asc", "desc"):
            return self._error(request, code="VALIDATION_ERROR",
                               message="sortOrder inválido",
                               http_status=status.HTTP_400_BAD_REQUEST,
                               details={"sortOrder": ["Debe ser 'asc' o 'desc'"]})

        qs = VacInventario.objects.select_related("vaccine", "center").all()

        if search := params.get("search"):
            qs = qs.filter(vaccine__name__icontains=search)

        if vaccine_id := params.get("vaccineId"):
            qs = qs.filter(vaccine_id=vaccine_id)

        if center_id := params.get("centerId"):
            qs = qs.filter(center_id=center_id)

        if (is_active := _parse_bool_param(params.get("isActive"))) is not None:
            qs = qs.filter(is_active=is_active)

        order_field = self.SORT_MAP[sort_by]
        qs = qs.order_by(f"-{order_field}" if sort_order == "desc" else order_field)

        items, total, total_pages = self._paginate_queryset(qs, page, page_size)
        serializer = VacInventarioListSerializer(items, many=True)
        return self._paginated_response(serializer.data, page, page_size, total, total_pages)

    def post(self, request):
        for perm in self.get_permissions():
            if not perm.has_permission(request, self):
                return self._error(request, code="INSUFFICIENT_PERMISSIONS",
                                   message="Sin permiso", http_status=403)

        serializer = VacInventarioCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return self._error(request, code="VALIDATION_ERROR",
                               message="Datos de entrada inválidos",
                               http_status=status.HTTP_400_BAD_REQUEST,
                               details=serializer.errors)

        vd = serializer.validated_data
        vaccine_id = vd["vaccineId"]
        center_id = vd["centerId"]

        if VacInventario.objects.filter(vaccine_id=vaccine_id, center_id=center_id).exists():
            return self._error(request, code="VAC_INVENTORY_EXISTS",
                               message="Ya existe un registro de inventario para esa vacuna en ese centro.",
                               http_status=status.HTTP_409_CONFLICT,
                               details={"vaccineId": ["Duplicado"], "centerId": ["Duplicado"]})

        actor_id = _get_actor_id(request.user)
        item = VacInventario.objects.create(
            vaccine_id=vaccine_id,
            center_id=center_id,
            stock_quantity=vd["stockQuantity"],
            applied_doses=0,
            is_active=True,
            created_at=timezone.now(),
            created_by_id=actor_id,
        )

        return Response(
            {"id": item.id, "vaccine": item.vaccine.name, "center": item.center.name},
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Inventario de Vacunas - Detail
# ---------------------------------------------------------------------------

class VacInventarioDetailView(FarmaciaCatalogPermissionMixin, ErrorMixin, APIView):
    catalog = "vacunas"

    def _get_object(self, pk):
        return VacInventario.objects.select_related("vaccine", "center").filter(pk=pk).first()

    def _not_found(self, request):
        return self._error(request, code="VAC_INVENTORY_NOT_FOUND",
                           message="Registro de inventario no encontrado.",
                           http_status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk):
        for perm in self.get_permissions():
            if not perm.has_permission(request, self):
                return self._error(request, code="INSUFFICIENT_PERMISSIONS",
                                   message="Sin permiso", http_status=403)

        item = self._get_object(pk)
        if not item:
            return self._not_found(request)
        return Response({"inventario": VacInventarioDetailSerializer(item).data})

    def put(self, request, pk):
        for perm in self.get_permissions():
            if not perm.has_permission(request, self):
                return self._error(request, code="INSUFFICIENT_PERMISSIONS",
                                   message="Sin permiso", http_status=403)

        item = self._get_object(pk)
        if not item:
            return self._not_found(request)

        serializer = VacInventarioUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return self._error(request, code="VALIDATION_ERROR",
                               message="Datos de entrada inválidos",
                               http_status=status.HTTP_400_BAD_REQUEST,
                               details=serializer.errors)

        vd = serializer.validated_data
        update_fields = ["updated_at", "updated_by_id"]

        if "stockQuantity" in vd:
            item.stock_quantity = vd["stockQuantity"]
            update_fields.append("stock_quantity")

        if "isActive" in vd:
            item.is_active = vd["isActive"]
            update_fields.append("is_active")

        item.updated_at = timezone.now()
        item.updated_by_id = _get_actor_id(request.user)
        item.save(update_fields=update_fields)

        item.refresh_from_db()
        return Response({"inventario": VacInventarioDetailSerializer(item).data})

    def delete(self, request, pk):
        for perm in self.get_permissions():
            if not perm.has_permission(request, self):
                return self._error(request, code="INSUFFICIENT_PERMISSIONS",
                                   message="Sin permiso", http_status=403)

        item = self._get_object(pk)
        if not item:
            return self._not_found(request)

        actor_id = _get_actor_id(request.user)
        item.is_active = False
        item.deleted_at = timezone.now()
        item.deleted_by_id = actor_id
        item.save(update_fields=["is_active", "deleted_at", "deleted_by_id"])

        return Response({"success": True})


# ---------------------------------------------------------------------------
# Aplicar dosis
# ---------------------------------------------------------------------------

class VacInventarioApplyDosesView(FarmaciaCatalogPermissionMixin, ErrorMixin, APIView):
    catalog = "vacunas"

    def _get_object(self, pk):
        return VacInventario.objects.select_related("vaccine", "center").filter(pk=pk).first()

    def post(self, request, pk):
        for perm in self.get_permissions():
            if not perm.has_permission(request, self):
                return self._error(request, code="INSUFFICIENT_PERMISSIONS",
                                   message="Sin permiso", http_status=403)

        item = self._get_object(pk)
        if not item:
            return self._error(request, code="VAC_INVENTORY_NOT_FOUND",
                               message="Registro de inventario no encontrado.",
                               http_status=status.HTTP_404_NOT_FOUND)

        if not item.is_active:
            return self._error(request, code="VAC_INVENTORY_INACTIVE",
                               message="No se pueden aplicar dosis a un registro inactivo.",
                               http_status=status.HTTP_409_CONFLICT)

        doses = request.data.get("doses")
        if doses is None:
            return self._error(request, code="VALIDATION_ERROR",
                               message="El campo doses es requerido.",
                               http_status=status.HTTP_400_BAD_REQUEST,
                               details={"doses": ["Este campo es requerido."]})

        try:
            doses = int(doses)
        except (TypeError, ValueError):
            return self._error(request, code="VALIDATION_ERROR",
                               message="El campo doses debe ser un número entero.",
                               http_status=status.HTTP_400_BAD_REQUEST,
                               details={"doses": ["Debe ser un número entero."]})

        if doses <= 0:
            return self._error(request, code="VALIDATION_ERROR",
                               message="La cantidad de dosis debe ser mayor a 0.",
                               http_status=status.HTTP_400_BAD_REQUEST,
                               details={"doses": ["Debe ser mayor a 0."]})

        available = item.stock_quantity - item.applied_doses
        if doses > available:
            return self._error(request, code="VAC_DOSES_EXCEED_STOCK",
                               message=f"No hay suficientes dosis disponibles. Disponibles: {available}, solicitadas: {doses}.",
                               http_status=status.HTTP_409_CONFLICT,
                               details={"doses": [f"Máximo disponible: {available}"]})

        item.applied_doses += doses
        item.updated_at = timezone.now()
        item.updated_by_id = _get_actor_id(request.user)
        item.save(update_fields=["applied_doses", "updated_at", "updated_by_id"])

        item.refresh_from_db()
        return Response({
            "inventario": VacInventarioDetailSerializer(item).data,
            "dosesApplied": doses,
        })
