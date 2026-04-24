from types import MappingProxyType
import traceback

from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalogos.models.cies import CatCies
from apps.catalogos.serializers import CatCiesSerializer
from apps.catalogos.uses_case.confirm_cies_use_case import ConfirmCiesUseCase
from apps.catalogos.uses_case.upload_cies_use_case import PreviewCiesUseCase

from .models import (
    Areas, Autorizadores, Bajas, CalidadLaboral, CatCentroAtencion,
    CatCentroAtencionHorario, CatCentroAtencionExcepcion, Consultorios, EdoCivil, Enfermedades,
    Escolaridad, Escuelas, Especialidades, EstudiosMed, GruposDeMedicamentos,
    Licencias, Ocupaciones, OrigenCons, Parentesco, Pases, Permisos,
    Roles, TipoDeCitas, TiposAreas, TiposSanguineo, TpAutorizacion, Turnos,
    Vacunas,
)
from .permissions import CatalogPermissionMixin, HasAnyOfPermissions
from .repositories.consultorios_repository import ConsultoriosRepository
from .serializers import (
    AreasDetailSerializer, AreasListSerializer, AreasWriteSerializer,
    AutorizadoresDetailSerializer, AutorizadoresListSerializer, AutorizadoresWriteSerializer,
    BajasDetailSerializer, BajasListSerializer, BajasWriteSerializer,
    CalidadLaboralDetailSerializer, CalidadLaboralListSerializer, CalidadLaboralWriteSerializer,
    CatCentroAtencionDetailSerializer, CatCentroAtencionHorarioDetailSerializer,
    CatCentroAtencionHorarioListSerializer, CatCentroAtencionHorarioWriteSerializer,
    CatCentroAtencionListSerializer, CatCentroAtencionWriteSerializer,
    CatCentroAtencionExcepcionListSerializer, CatCentroAtencionExcepcionDetailSerializer,
    CatCentroAtencionExcepcionWriteSerializer,
    CodigoPostalResultSerializer, ConsultoriosDetailSerializer,
    ConsultoriosListSerializer, ConsultoriosWriteSerializer,
    EdoCivilDetailSerializer, EdoCivilListSerializer, EdoCivilWriteSerializer,
    EnfermedadesDetailSerializer, EnfermedadesListSerializer, EnfermedadesWriteSerializer,
    EscolaridadDetailSerializer, EscolaridadListSerializer, EscolaridadWriteSerializer,
    EscuelasDetailSerializer, EscuelasListSerializer, EscuelasWriteSerializer,
    EspecialidadesDetailSerializer, EspecialidadesListSerializer, EspecialidadesWriteSerializer,
    EstudiosMedDetailSerializer, EstudiosMedListSerializer, EstudiosMedWriteSerializer,
    GruposDeMedicamentosDetailSerializer, GruposDeMedicamentosListSerializer, GruposDeMedicamentosWriteSerializer,
    LicenciasDetailSerializer, LicenciasListSerializer, LicenciasWriteSerializer,
    OcupacionesDetailSerializer, OcupacionesListSerializer, OcupacionesWriteSerializer,
    OrigenConsDetailSerializer, OrigenConsListSerializer, OrigenConsWriteSerializer,
    ParentescoDetailSerializer, ParentescoListSerializer, ParentescoWriteSerializer,
    PasesDetailSerializer, PasesListSerializer, PasesWriteSerializer,
    PermisosDetailSerializer, PermisosListSerializer, PermisosWriteSerializer,
    RolesDetailSerializer, RolesListSerializer, RolesWriteSerializer,
    TipoDeCitasDetailSerializer, TipoDeCitasListSerializer, TipoDeCitasWriteSerializer,
    TiposAreasDetailSerializer, TiposAreasListSerializer, TiposAreasWriteSerializer,
    TiposSanguineoDetailSerializer, TiposSanguineoListSerializer, TiposSanguineoWriteSerializer,
    TpAutorizacionDetailSerializer, TpAutorizacionListSerializer, TpAutorizacionWriteSerializer,
    TurnosDetailSerializer, TurnosListSerializer, TurnosWriteSerializer,
    VacunasDetailSerializer, VacunasListSerializer, VacunasWriteSerializer,
)
from .services.codigo_postal_service import CodigoPostalService

# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def _get_actor_id(user):
    return getattr(user, "id_usuario", None) or getattr(user, "id", None)


def _parse_bool_param(value):
    """Convierte 'true'/'false' a bool. Retorna None si el valor es inválido."""
    if value is None:
        return None
    normalized = value.lower()
    if normalized not in ("true", "false"):
        return None
    return normalized == "true"


# ---------------------------------------------------------------------------
# Mixins
# ---------------------------------------------------------------------------

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


class PaginationMixin:
    """Parsea y valida los parámetros de paginación comunes."""

    def _parse_pagination(self, request):
        """
        Retorna (page, page_size) o lanza ValueError con un Response de error listo.
        Uso: page, page_size = self._parse_pagination(request)
        """
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

        if page < 1 or page_size < 1 or page_size > 100:
            raise _PaginationError(
                self._error(
                    request,
                    code="VALIDATION_ERROR",
                    message="Parámetros de paginación fuera de rango",
                    http_status=status.HTTP_400_BAD_REQUEST,
                    details={
                        "page": ["Debe ser mayor o igual a 1"],
                        "pageSize": ["Debe estar entre 1 y 100"],
                    },
                )
            )

        return page, page_size

    @staticmethod
    def _paginate_queryset(qs, page, page_size):
        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start: start + page_size]
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


class _PaginationError(Exception):
    """Transporta un Response de error de paginación ya construido."""
    def __init__(self, response):
        self.response = response


# ---------------------------------------------------------------------------
# Vistas base
# ---------------------------------------------------------------------------

class CatalogBaseListCreateView(PaginationMixin, CatalogPermissionMixin, ErrorMixin, APIView):
    model = None
    list_serializer = None
    write_serializer = None
    name_field = "name"
    error_codes = MappingProxyType({})
    sort_map = MappingProxyType({"name": "name", "isActive": "is_active"})

    def get_queryset(self):
        return self.model.objects.all()

    def _model_field_names(self):
        meta = getattr(self.model, "_meta", None)
        return {f.name for f in meta.get_fields()} if meta else set()

    def get(self, request):
        try:
            page, page_size = self._parse_pagination(request)
        except _PaginationError as exc:
            return exc.response

        sort_by = request.query_params.get("sortBy", "name")
        sort_order = request.query_params.get("sortOrder", "asc")

        if sort_by not in self.sort_map:
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Parámetro sortBy inválido",
                http_status=status.HTTP_400_BAD_REQUEST,
                details={"sortBy": [f"Permitidos: {', '.join(self.sort_map.keys())}"]},
            )

        if sort_order not in ("asc", "desc"):
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Parámetro sortOrder inválido",
                http_status=status.HTTP_400_BAD_REQUEST,
                details={"sortOrder": ["Debe ser 'asc' o 'desc'"]},
            )

        qs = self.get_queryset()
        search = request.query_params.get("search")
        is_active_raw = request.query_params.get("isActive")

        if search:
            qs = qs.filter(**{f"{self.name_field}__icontains": search})

        if is_active_raw is not None:
            is_active = _parse_bool_param(is_active_raw)
            if is_active is None:
                return self._error(
                    request,
                    code="VALIDATION_ERROR",
                    message="Parámetro isActive inválido",
                    http_status=status.HTTP_400_BAD_REQUEST,
                    details={"isActive": ["Debe ser 'true' o 'false'"]},
                )
            qs = qs.filter(is_active=is_active)

        order_field = self.sort_map[sort_by]
        qs = qs.order_by(f"-{order_field}" if sort_order == "desc" else order_field)

        items, total, total_pages = self._paginate_queryset(qs, page, page_size)
        serializer = self.list_serializer(items, many=True)
        return self._paginated_response(serializer.data, page, page_size, total, total_pages)

    def post(self, request):
        serializer = self.write_serializer(data=request.data)
        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        name = serializer.validated_data.get(self.name_field)
        if name and self.model.objects.filter(**{self.name_field: name}).exists():
            return self._error(
                request,
                code=self.error_codes.get("exists", "ITEM_EXISTS"),
                message="Duplicado",
                http_status=status.HTTP_409_CONFLICT,
                details={"name": ["Duplicado"]},
            )

        model_fields = self._model_field_names()
        save_kwargs = {}
        if "created_at" in model_fields:
            save_kwargs["created_at"] = timezone.now()
        if "created_by_id" in model_fields:
            save_kwargs["created_by_id"] = _get_actor_id(request.user)

        item = serializer.save(**save_kwargs)
        return Response(
            {"id": _resolve_pk(item), "name": _resolve_name(item)},
            status=status.HTTP_201_CREATED,
        )


class CatalogBaseDetailView(CatalogPermissionMixin, ErrorMixin, APIView):
    model = None
    detail_serializer = None
    write_serializer = None
    wrapper_key = None
    name_field = "name"
    pk_field = None
    error_codes = MappingProxyType({})

    def _pk_name(self):
        return self.pk_field or self.model._meta.pk.name

    def get_object(self, pk):
        return self.model.objects.filter(**{self._pk_name(): pk}).first()

    def _model_field_names(self):
        meta = getattr(self.model, "_meta", None)
        return {f.name for f in meta.get_fields()} if meta else set()

    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return self._error(
                request,
                code=self.error_codes.get("not_found", "ITEM_NOT_FOUND"),
                message="No encontrado",
                http_status=status.HTTP_404_NOT_FOUND,
            )
        return Response({self.wrapper_key: self.detail_serializer(item).data})

    def put(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return self._error(
                request,
                code=self.error_codes.get("not_found", "ITEM_NOT_FOUND"),
                message="No encontrado",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.write_serializer(item, data=request.data, partial=True)
        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        name = serializer.validated_data.get(self.name_field)
        pk_name = self._pk_name()
        if (
            name
            and self.model.objects
            .filter(**{self.name_field: name})
            .exclude(**{pk_name: getattr(item, pk_name)})
            .exists()
        ):
            return self._error(
                request,
                code=self.error_codes.get("exists", "ITEM_EXISTS"),
                message="Duplicado",
                http_status=status.HTTP_409_CONFLICT,
                details={"name": ["Duplicado"]},
            )

        model_fields = self._model_field_names()
        save_kwargs = {}
        if "updated_at" in model_fields:
            save_kwargs["updated_at"] = timezone.now()
        if "updated_by_id" in model_fields:
            save_kwargs["updated_by_id"] = _get_actor_id(request.user)

        updated = serializer.save(**save_kwargs)
        return Response({self.wrapper_key: self.detail_serializer(updated).data})

    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return self._error(
                request,
                code=self.error_codes.get("not_found", "ITEM_NOT_FOUND"),
                message="No encontrado",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        model_fields = self._model_field_names()
        update_fields = []
        actor_id = _get_actor_id(request.user)

        if "is_active" in model_fields:
            item.is_active = False
            update_fields.append("is_active")
        if "deleted_at" in model_fields:
            item.deleted_at = timezone.now()
            update_fields.append("deleted_at")
        if "deleted_by_id" in model_fields:
            item.deleted_by_id = actor_id
            update_fields.append("deleted_by_id")

        item.save(update_fields=update_fields)
        return Response({"success": True})


# ---------------------------------------------------------------------------
# Helpers internos de resolución de PK/nombre
# ---------------------------------------------------------------------------

def _resolve_pk(item):
    return (
        getattr(item, "id", None)
        or getattr(item, "id_rol", None)
        or getattr(item, "id_permiso", None)
    )


def _resolve_name(item):
    return (
        getattr(item, "name", None)
        or getattr(item, "rol", None)
        or getattr(item, "descripcion", None)
    )


# ---------------------------------------------------------------------------
# CatCentroAtencion
# ---------------------------------------------------------------------------

class CentrosAtencionListCreateView(CatalogBaseListCreateView):
    catalog = "centros_atencion"
    model = CatCentroAtencion
    list_serializer = CatCentroAtencionListSerializer
    write_serializer = CatCentroAtencionWriteSerializer
    error_codes = MappingProxyType({"exists": "CARE_CENTER_EXISTS"})
    sort_map = MappingProxyType({
        "name": "name",
        "isActive": "is_active",
        "code": "code",
        "centerType": "center_type",
        "legacyFolio": "legacy_folio",
    })

    def get_permissions(self):
        if getattr(self, "request", None) and self.request.method == "GET":
            return [HasAnyOfPermissions(
                "admin:catalogos:centros_atencion:read",
                "admin:gestion:usuarios:read",
                "admin:gestion:usuarios:create",
                "admin:gestion:usuarios:update",
            )]
        return super().get_permissions()

    def get_queryset(self):
        qs = self.model.objects.all()
        params = self.request.query_params

        if center_type := params.get("centerType"):
            qs = qs.filter(center_type=center_type)

        if (is_external := _parse_bool_param(params.get("isExternal"))) is not None:
            qs = qs.filter(is_external=is_external)

        if postal_code := params.get("postalCode"):
            qs = qs.filter(postal_code=postal_code)

        return qs
    
    def post(self, request):
        serializer = self.write_serializer(data=request.data)

        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        # Validación personalizada por CLUES (code)
        code = serializer.validated_data.get("code")
        if code and self.model.objects.filter(code=code).exists():
            return self._error(
                request,
                code="CARE_CENTER_EXISTS",
                message="Ya existe un centro con ese CLUES",
                http_status=status.HTTP_409_CONFLICT,
                details={"code": ["Duplicado"]},
            )

        # Campos automáticos (igual que la base)
        model_fields = self._model_field_names()
        save_kwargs = {}

        if "created_at" in model_fields:
            save_kwargs["created_at"] = timezone.now()

        if "created_by_id" in model_fields:
            save_kwargs["created_by_id"] = _get_actor_id(request.user)

        item = serializer.save(**save_kwargs)

        return Response(
            {"id": item.id, "name": str(item)},
            status=status.HTTP_201_CREATED,
        )
    


    




class CentrosAtencionDetailView(CatalogBaseDetailView):
    catalog = "centros_atencion"
    model = CatCentroAtencion
    detail_serializer = CatCentroAtencionDetailSerializer
    write_serializer = CatCentroAtencionWriteSerializer
    wrapper_key = "careCenter"
    error_codes = MappingProxyType({"not_found": "CARE_CENTER_NOT_FOUND", "exists": "CARE_CENTER_EXISTS"})


# ---------------------------------------------------------------------------
# CatCentroAtencionHorario
# ---------------------------------------------------------------------------

class CentrosAtencionHorariosListCreateView(CatalogBaseListCreateView):
    catalog = "centros_atencion_horarios"
    model = CatCentroAtencionHorario
    list_serializer = CatCentroAtencionHorarioListSerializer
    write_serializer = CatCentroAtencionHorarioWriteSerializer
    name_field = "id"
    error_codes = MappingProxyType({"exists": "CARE_CENTER_SCHEDULE_EXISTS"})
    sort_map = MappingProxyType({"name": "id", "isActive": "is_active", "weekDay": "week_day"})

    def get_queryset(self):
        qs = self.model.objects.select_related("center", "shift").all()
        params = self.request.query_params

        if center_id := params.get("centerId"):
            qs = qs.filter(center_id=center_id)
        if shift_id := params.get("shiftId"):
            qs = qs.filter(shift_id=shift_id)
        if week_day := params.get("weekDay"):
            qs = qs.filter(week_day=week_day)
        if (is_open := _parse_bool_param(params.get("isOpen"))) is not None:
            qs = qs.filter(is_open=is_open)
        if (is_24h := _parse_bool_param(params.get("is24Hours"))) is not None:
            qs = qs.filter(is_24_hours=is_24h)

        return qs.order_by("center__name", "week_day", "shift__name")

    def post(self, request):
        serializer = self.write_serializer(data=request.data)
        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        vd = serializer.validated_data
        if self.model.objects.filter(
            center_id=vd["center_id"],
            shift_id=vd["shift_id"],
            week_day=vd["week_day"],
        ).exists():
            return self._error(
                request,
                code="CARE_CENTER_SCHEDULE_EXISTS",
                message="Ya existe un horario para ese centro, turno y día.",
                http_status=status.HTTP_409_CONFLICT,
                details={"centerId": ["Duplicado"], "shiftId": ["Duplicado"], "weekDay": ["Duplicado"]},
            )

        item = serializer.save(created_at=timezone.now(), created_by_id=_get_actor_id(request.user))
        return Response({"id": item.id, "name": f"Horario {item.id}"}, status=status.HTTP_201_CREATED)


class CentrosAtencionHorariosDetailView(CatalogBaseDetailView):
    catalog = "centros_atencion_horarios"
    model = CatCentroAtencionHorario
    detail_serializer = CatCentroAtencionHorarioDetailSerializer
    write_serializer = CatCentroAtencionHorarioWriteSerializer
    wrapper_key = "careCenterSchedule"
    error_codes = MappingProxyType({
        "not_found": "CARE_CENTER_SCHEDULE_NOT_FOUND",
        "exists": "CARE_CENTER_SCHEDULE_EXISTS",
    })

    def put(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return self._error(
                request,
                code="CARE_CENTER_SCHEDULE_NOT_FOUND",
                message="Horario no encontrado",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.write_serializer(item, data=request.data, partial=True)
        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        vd = serializer.validated_data
        if self.model.objects.filter(
            center_id=vd.get("center_id", item.center_id),
            shift_id=vd.get("shift_id", item.shift_id),
            week_day=vd.get("week_day", item.week_day),
        ).exclude(pk=item.pk).exists():
            return self._error(
                request,
                code="CARE_CENTER_SCHEDULE_EXISTS",
                message="Ya existe un horario para ese centro, turno y día.",
                http_status=status.HTTP_409_CONFLICT,
                details={"centerId": ["Duplicado"], "shiftId": ["Duplicado"], "weekDay": ["Duplicado"]},
            )

        updated = serializer.save(updated_at=timezone.now(), updated_by_id=_get_actor_id(request.user))
        return Response({"careCenterSchedule": self.detail_serializer(updated).data})


# ---------------------------------------------------------------------------
# Código Postal
# ---------------------------------------------------------------------------

class CodigoPostalSearchAPIView(CatalogPermissionMixin, ErrorMixin, APIView):
    catalog = "centros_atencion"

    def get(self, request):
        cp = (request.query_params.get("cp") or "").strip()

        if not cp:
            return self._error(
                request, code="VALIDATION_ERROR",
                message="El parámetro cp es requerido",
                http_status=status.HTTP_400_BAD_REQUEST,
                details={"cp": ["Este campo es requerido"]},
            )
        if not cp.isdigit() or len(cp) != 5:
            return self._error(
                request, code="VALIDATION_ERROR",
                message="Código postal inválido",
                http_status=status.HTTP_400_BAD_REQUEST,
                details={"cp": ["Debe contener 5 dígitos"]},
            )

        results = CodigoPostalService.search(cp)
        return Response({"items": CodigoPostalResultSerializer(results, many=True).data})


# ---------------------------------------------------------------------------
# Consultorios (usa repositorio propio)
# ---------------------------------------------------------------------------

class ConsultoriosListCreateView(PaginationMixin, CatalogPermissionMixin, ErrorMixin, APIView):
    catalog = "consultorios"
    repository = ConsultoriosRepository()

    def get(self, request):
        try:
            page, page_size = self._parse_pagination(request)
        except _PaginationError as exc:
            return exc.response

        is_active_raw = request.query_params.get("isActive")
        est_activo = None
        if is_active_raw is not None:
            est_activo = _parse_bool_param(is_active_raw)
            if est_activo is None:
                return self._error(
                    request, code="VALIDATION_ERROR",
                    message="Parámetro isActive inválido",
                    http_status=status.HTTP_400_BAD_REQUEST,
                    details={"isActive": ["Debe ser 'true' o 'false'"]},
                )

        qs = self.repository.get_all(
            search=request.query_params.get("search"),
            est_activo=est_activo,
            sort_by=request.query_params.get("sortBy", "code"),
            sort_order=request.query_params.get("sortOrder", "asc"),
        )

        items, total, total_pages = self._paginate_queryset(qs, page, page_size)
        serializer = ConsultoriosListSerializer(items, many=True)
        return self._paginated_response(serializer.data, page, page_size, total, total_pages)

    def post(self, request):
        serializer = ConsultoriosWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return self._error(
                request, code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        consultorio = self.repository.create(
            validated_data=serializer.validated_data,
            actor_id=_get_actor_id(request.user),
        )
        return Response({"id": consultorio.id, "name": consultorio.name}, status=status.HTTP_201_CREATED)


class ConsultoriosDetailView(CatalogPermissionMixin, ErrorMixin, APIView):
    catalog = "consultorios"
    repository = ConsultoriosRepository()

    def _get_or_404(self, request, pk):
        obj = self.repository.get_by_id(pk)
        if not obj:
            return None, self._error(
                request, code="CONSULTING_ROOM_NOT_FOUND",
                message="Consultorio no encontrado",
                http_status=status.HTTP_404_NOT_FOUND,
            )
        return obj, None

    def get(self, request, pk):
        obj, err = self._get_or_404(request, pk)
        if err:
            return err
        return Response({"consultingRoom": ConsultoriosDetailSerializer(obj).data})

    def put(self, request, pk):
        obj, err = self._get_or_404(request, pk)
        if err:
            return err

        serializer = ConsultoriosWriteSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return self._error(
                request, code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        updated = self.repository.update(
            consultorio=obj,
            validated_data=serializer.validated_data,
            actor_id=_get_actor_id(request.user),
        )
        return Response({"consultingRoom": ConsultoriosDetailSerializer(updated).data})

    def delete(self, request, pk):
        obj, err = self._get_or_404(request, pk)
        if err:
            return err
        self.repository.delete(consultorio=obj, actor_id=_get_actor_id(request.user))
        return Response({"success": True})


# ---------------------------------------------------------------------------
# Catálogos simples
# ---------------------------------------------------------------------------

class AreasListCreateView(CatalogBaseListCreateView):
    catalog = "areas"
    model = Areas
    list_serializer = AreasListSerializer
    write_serializer = AreasWriteSerializer
    error_codes = MappingProxyType({"exists": "AREAS_EXISTS"})

class AreasDetailView(CatalogBaseDetailView):
    catalog = "areas"
    model = Areas
    detail_serializer = AreasDetailSerializer
    write_serializer = AreasWriteSerializer
    wrapper_key = "area"
    error_codes = MappingProxyType({"not_found": "AREAS_NOT_FOUND", "exists": "AREAS_EXISTS"})


class AutorizadoresListCreateView(CatalogBaseListCreateView):
    catalog = "autorizadores"
    model = Autorizadores
    list_serializer = AutorizadoresListSerializer
    write_serializer = AutorizadoresWriteSerializer
    error_codes = MappingProxyType({"exists": "AUTHORIZER_STUDIES_EXISTS"})

class AutorizadoresDetailView(CatalogBaseDetailView):
    catalog = "autorizadores"
    model = Autorizadores
    detail_serializer = AutorizadoresDetailSerializer
    write_serializer = AutorizadoresWriteSerializer
    wrapper_key = "authorizer"
    error_codes = MappingProxyType({"not_found": "AUTHORIZER_NOT_FOUND", "exists": "AUTHORIZER_STUDIES_EXISTS"})


class BajasListCreateView(CatalogBaseListCreateView):
    catalog = "bajas"
    model = Bajas
    list_serializer = BajasListSerializer
    write_serializer = BajasWriteSerializer
    error_codes = MappingProxyType({"exists": "DISCHARGE_REASON_EXISTS"})

class BajasDetailView(CatalogBaseDetailView):
    catalog = "bajas"
    model = Bajas
    detail_serializer = BajasDetailSerializer
    write_serializer = BajasWriteSerializer
    wrapper_key = "dischargeReason"
    error_codes = MappingProxyType({"not_found": "DISCHARGE_REASON_NOT_FOUND", "exists": "DISCHARGE_REASON_EXISTS"})


class CalidadLaboralListCreateView(CatalogBaseListCreateView):
    catalog = "calidad_laboral"
    model = CalidadLaboral
    list_serializer = CalidadLaboralListSerializer
    write_serializer = CalidadLaboralWriteSerializer
    error_codes = MappingProxyType({"exists": "LABOR_QUALITY_EXISTS"})

class CalidadLaboralDetailView(CatalogBaseDetailView):
    catalog = "calidad_laboral"
    model = CalidadLaboral
    detail_serializer = CalidadLaboralDetailSerializer
    write_serializer = CalidadLaboralWriteSerializer
    wrapper_key = "laborQuality"
    error_codes = MappingProxyType({"not_found": "LABOR_QUALITY_NOT_FOUND", "exists": "LABOR_QUALITY_EXISTS"})


class EdoCivilListCreateView(CatalogBaseListCreateView):
    catalog = "edo_civil"
    model = EdoCivil
    list_serializer = EdoCivilListSerializer
    write_serializer = EdoCivilWriteSerializer
    error_codes = MappingProxyType({"exists": "CIVIL_STATUS_EXISTS"})

class EdoCivilDetailView(CatalogBaseDetailView):
    catalog = "edo_civil"
    model = EdoCivil
    detail_serializer = EdoCivilDetailSerializer
    write_serializer = EdoCivilWriteSerializer
    wrapper_key = "civilStatus"
    error_codes = MappingProxyType({"not_found": "CIVIL_STATUS_NOT_FOUND", "exists": "CIVIL_STATUS_EXISTS"})


class EnfermedadesListCreateView(CatalogBaseListCreateView):
    catalog = "enfermedades"
    model = Enfermedades
    list_serializer = EnfermedadesListSerializer
    write_serializer = EnfermedadesWriteSerializer
    error_codes = MappingProxyType({"exists": "DISEASE_EXISTS"})

class EnfermedadesDetailView(CatalogBaseDetailView):
    catalog = "enfermedades"
    model = Enfermedades
    detail_serializer = EnfermedadesDetailSerializer
    write_serializer = EnfermedadesWriteSerializer
    wrapper_key = "disease"
    error_codes = MappingProxyType({"not_found": "DISEASE_NOT_FOUND", "exists": "DISEASE_EXISTS"})


class EscolaridadListCreateView(CatalogBaseListCreateView):
    catalog = "escolaridad"
    model = Escolaridad
    list_serializer = EscolaridadListSerializer
    write_serializer = EscolaridadWriteSerializer
    error_codes = MappingProxyType({"exists": "EDUCATION_LEVEL_EXISTS"})

class EscolaridadDetailView(CatalogBaseDetailView):
    catalog = "escolaridad"
    model = Escolaridad
    detail_serializer = EscolaridadDetailSerializer
    write_serializer = EscolaridadWriteSerializer
    wrapper_key = "educationLevel"
    error_codes = MappingProxyType({"not_found": "EDUCATION_LEVEL_NOT_FOUND", "exists": "EDUCATION_LEVEL_EXISTS"})


class EscuelasListCreateView(CatalogBaseListCreateView):
    catalog = "escuelas"
    model = Escuelas
    list_serializer = EscuelasListSerializer
    write_serializer = EscuelasWriteSerializer
    error_codes = MappingProxyType({"exists": "SCHOOL_EXISTS"})

class EscuelasDetailView(CatalogBaseDetailView):
    catalog = "escuelas"
    model = Escuelas
    detail_serializer = EscuelasDetailSerializer
    write_serializer = EscuelasWriteSerializer
    wrapper_key = "school"
    error_codes = MappingProxyType({"not_found": "SCHOOL_NOT_FOUND", "exists": "SCHOOL_EXISTS"})


class EspecialidadesListCreateView(CatalogBaseListCreateView):
    catalog = "especialidades"
    model = Especialidades
    list_serializer = EspecialidadesListSerializer
    write_serializer = EspecialidadesWriteSerializer
    error_codes = MappingProxyType({"exists": "SPECIALTY_EXISTS"})

class EspecialidadesDetailView(CatalogBaseDetailView):
    catalog = "especialidades"
    model = Especialidades
    detail_serializer = EspecialidadesDetailSerializer
    write_serializer = EspecialidadesWriteSerializer
    wrapper_key = "specialty"
    error_codes = MappingProxyType({"not_found": "SPECIALTY_NOT_FOUND", "exists": "SPECIALTY_EXISTS"})


class EstudiosMedListCreateView(CatalogBaseListCreateView):
    catalog = "estudios_med"
    model = EstudiosMed
    list_serializer = EstudiosMedListSerializer
    write_serializer = EstudiosMedWriteSerializer
    error_codes = MappingProxyType({"exists": "MEDICAL_STUDIES_EXISTS"})

class EstudiosMedDetailView(CatalogBaseDetailView):
    catalog = "estudios_med"
    model = EstudiosMed
    detail_serializer = EstudiosMedDetailSerializer
    write_serializer = EstudiosMedWriteSerializer
    wrapper_key = "medicalStudy"
    error_codes = MappingProxyType({"not_found": "MEDICAL_STUDIES_NOT_FOUND", "exists": "MEDICAL_STUDIES_EXISTS"})


class GruposDeMedicamentosListCreateView(CatalogBaseListCreateView):
    catalog = "grupos_medicamentos"
    model = GruposDeMedicamentos
    list_serializer = GruposDeMedicamentosListSerializer
    write_serializer = GruposDeMedicamentosWriteSerializer
    error_codes = MappingProxyType({"exists": "MED_GROUP_EXISTS"})

class GruposDeMedicamentosDetailView(CatalogBaseDetailView):
    catalog = "grupos_medicamentos"
    model = GruposDeMedicamentos
    detail_serializer = GruposDeMedicamentosDetailSerializer
    write_serializer = GruposDeMedicamentosWriteSerializer
    wrapper_key = "medicationGroup"
    error_codes = MappingProxyType({"not_found": "MED_GROUP_NOT_FOUND", "exists": "MED_GROUP_EXISTS"})


class LicenciasListCreateView(CatalogBaseListCreateView):
    catalog = "licencias"
    model = Licencias
    list_serializer = LicenciasListSerializer
    write_serializer = LicenciasWriteSerializer
    error_codes = MappingProxyType({"exists": "LICENSE_EXISTS"})

class LicenciasDetailView(CatalogBaseDetailView):
    catalog = "licencias"
    model = Licencias
    detail_serializer = LicenciasDetailSerializer
    write_serializer = LicenciasWriteSerializer
    wrapper_key = "license"
    error_codes = MappingProxyType({"not_found": "LICENSE_NOT_FOUND", "exists": "LICENSE_EXISTS"})


class OcupacionesListCreateView(CatalogBaseListCreateView):
    catalog = "ocupaciones"
    model = Ocupaciones
    list_serializer = OcupacionesListSerializer
    write_serializer = OcupacionesWriteSerializer
    error_codes = MappingProxyType({"exists": "OCCUPATIONS_EXISTS"})

class OcupacionesDetailView(CatalogBaseDetailView):
    catalog = "ocupaciones"
    model = Ocupaciones
    detail_serializer = OcupacionesDetailSerializer
    write_serializer = OcupacionesWriteSerializer
    wrapper_key = "occupation"
    error_codes = MappingProxyType({"not_found": "OCCUPATIONS_NOT_FOUND", "exists": "OCCUPATIONS_EXISTS"})


class OrigenConsListCreateView(CatalogBaseListCreateView):
    catalog = "origen_cons"
    model = OrigenCons
    list_serializer = OrigenConsListSerializer
    write_serializer = OrigenConsWriteSerializer
    error_codes = MappingProxyType({"exists": "CONSULTATION_ORIGIN_EXISTS"})

class OrigenConsDetailView(CatalogBaseDetailView):
    catalog = "origen_cons"
    model = OrigenCons
    detail_serializer = OrigenConsDetailSerializer
    write_serializer = OrigenConsWriteSerializer
    wrapper_key = "consultationOrigin"
    error_codes = MappingProxyType({"not_found": "CONSULTATION_ORIGIN_NOT_FOUND", "exists": "CONSULTATION_ORIGIN_EXISTS"})


class ParentescoListCreateView(CatalogBaseListCreateView):
    catalog = "parentescos"
    model = Parentesco
    list_serializer = ParentescoListSerializer
    write_serializer = ParentescoWriteSerializer
    error_codes = MappingProxyType({"exists": "KINSHIP_EXISTS"})

class ParentescoDetailView(CatalogBaseDetailView):
    catalog = "parentescos"
    model = Parentesco
    detail_serializer = ParentescoDetailSerializer
    write_serializer = ParentescoWriteSerializer
    wrapper_key = "kinship"
    error_codes = MappingProxyType({"not_found": "KINSHIP_NOT_FOUND", "exists": "KINSHIP_EXISTS"})


class PasesListCreateView(CatalogBaseListCreateView):
    catalog = "pases"
    model = Pases
    list_serializer = PasesListSerializer
    write_serializer = PasesWriteSerializer
    error_codes = MappingProxyType({"exists": "PASS_EXISTS"})

class PasesDetailView(CatalogBaseDetailView):
    catalog = "pases"
    model = Pases
    detail_serializer = PasesDetailSerializer
    write_serializer = PasesWriteSerializer
    wrapper_key = "pass"
    error_codes = MappingProxyType({"not_found": "PASS_NOT_FOUND", "exists": "PASS_EXISTS"})


class PermisosListCreateView(CatalogBaseListCreateView):
    catalog = "permisos"
    model = Permisos
    list_serializer = PermisosListSerializer
    write_serializer = PermisosWriteSerializer
    name_field = "descripcion"
    sort_map = MappingProxyType({"name": "descripcion", "isActive": "is_active"})
    error_codes = MappingProxyType({"exists": "PERMISSIONS_EXISTS"})

class PermisosDetailView(CatalogBaseDetailView):
    catalog = "permisos"
    model = Permisos
    detail_serializer = PermisosDetailSerializer
    write_serializer = PermisosWriteSerializer
    name_field = "descripcion"
    pk_field = "id_permiso"
    wrapper_key = "permission"
    error_codes = MappingProxyType({"not_found": "PERMISSIONS_NOT_FOUND", "exists": "PERMISSIONS_EXISTS"})


class RolesListCreateView(CatalogBaseListCreateView):
    catalog = "roles"
    model = Roles
    list_serializer = RolesListSerializer
    write_serializer = RolesWriteSerializer
    name_field = "rol"
    sort_map = MappingProxyType({"name": "rol", "isActive": "is_active"})
    error_codes = MappingProxyType({"exists": "ROLE_EXISTS"})

class RolesDetailView(CatalogBaseDetailView):
    catalog = "roles"
    model = Roles
    detail_serializer = RolesDetailSerializer
    write_serializer = RolesWriteSerializer
    name_field = "rol"
    pk_field = "id_rol"
    wrapper_key = "role"
    error_codes = MappingProxyType({"not_found": "ROLE_NOT_FOUND", "exists": "ROLE_EXISTS"})


class TiposAreasListCreateView(CatalogBaseListCreateView):
    catalog = "tipos_areas"
    model = TiposAreas
    list_serializer = TiposAreasListSerializer
    write_serializer = TiposAreasWriteSerializer
    error_codes = MappingProxyType({"exists": "AREA_TYPE_EXISTS"})

class TiposAreasDetailView(CatalogBaseDetailView):
    catalog = "tipos_areas"
    model = TiposAreas
    detail_serializer = TiposAreasDetailSerializer
    write_serializer = TiposAreasWriteSerializer
    wrapper_key = "areaType"
    error_codes = MappingProxyType({"not_found": "AREA_TYPE_NOT_FOUND", "exists": "AREA_TYPE_EXISTS"})


class TipoDeCitasListCreateView(CatalogBaseListCreateView):
    catalog = "tipo_citas"
    model = TipoDeCitas
    list_serializer = TipoDeCitasListSerializer
    write_serializer = TipoDeCitasWriteSerializer
    error_codes = MappingProxyType({"exists": "APPOINTMENT_TYPE_EXISTS"})

class TipoDeCitasDetailView(CatalogBaseDetailView):
    catalog = "tipo_citas"
    model = TipoDeCitas
    detail_serializer = TipoDeCitasDetailSerializer
    write_serializer = TipoDeCitasWriteSerializer
    wrapper_key = "appointmentType"
    error_codes = MappingProxyType({"not_found": "APPOINTMENT_TYPE_NOT_FOUND", "exists": "APPOINTMENT_TYPE_EXISTS"})


class TiposSanguineoListCreateView(CatalogBaseListCreateView):
    catalog = "tipos_sanguineo"
    model = TiposSanguineo
    list_serializer = TiposSanguineoListSerializer
    write_serializer = TiposSanguineoWriteSerializer
    error_codes = MappingProxyType({"exists": "BLOOD_TYPE_EXISTS"})

class TiposSanguineoDetailView(CatalogBaseDetailView):
    catalog = "tipos_sanguineo"
    model = TiposSanguineo
    detail_serializer = TiposSanguineoDetailSerializer
    write_serializer = TiposSanguineoWriteSerializer
    wrapper_key = "bloodType"
    error_codes = MappingProxyType({"not_found": "BLOOD_TYPE_NOT_FOUND", "exists": "BLOOD_TYPE_EXISTS"})


class TpAutorizacionListCreateView(CatalogBaseListCreateView):
    catalog = "tp_autorizacion"
    model = TpAutorizacion
    list_serializer = TpAutorizacionListSerializer
    write_serializer = TpAutorizacionWriteSerializer
    error_codes = MappingProxyType({"exists": "AUTH_TYPE_STUDIES_EXISTS"})

class TpAutorizacionDetailView(CatalogBaseDetailView):
    catalog = "tp_autorizacion"
    model = TpAutorizacion
    detail_serializer = TpAutorizacionDetailSerializer
    write_serializer = TpAutorizacionWriteSerializer
    wrapper_key = "authorizationType"
    error_codes = MappingProxyType({"not_found": "AUTH_TYPE_NOT_FOUND", "exists": "AUTH_TYPE_STUDIES_EXISTS"})


class TurnosListCreateView(CatalogBaseListCreateView):
    catalog = "turnos"
    model = Turnos
    list_serializer = TurnosListSerializer
    write_serializer = TurnosWriteSerializer
    error_codes = MappingProxyType({"exists": "SHIFT_EXISTS"})

class TurnosDetailView(CatalogBaseDetailView):
    catalog = "turnos"
    model = Turnos
    detail_serializer = TurnosDetailSerializer
    write_serializer = TurnosWriteSerializer
    wrapper_key = "shift"
    error_codes = MappingProxyType({"not_found": "SHIFT_NOT_FOUND", "exists": "SHIFT_EXISTS"})


# ---------------------------------------------------------------------------
# Vacunas
# ---------------------------------------------------------------------------

class VacunasListCreateView(CatalogBaseListCreateView):
    catalog = "vacunas"
    model = Vacunas
    list_serializer = VacunasListSerializer
    write_serializer = VacunasWriteSerializer
    error_codes = MappingProxyType({"exists": "VACCINE_EXISTS"})

class VacunasDetailView(CatalogBaseDetailView):
    catalog = "vacunas"
    model = Vacunas
    detail_serializer = VacunasDetailSerializer
    write_serializer = VacunasWriteSerializer
    wrapper_key = "vaccine"
    error_codes = MappingProxyType({"not_found": "VACCINE_NOT_FOUND", "exists": "VACCINE_EXISTS"})


# ---------------------------------------------------------------------------
# CatCies
# ---------------------------------------------------------------------------

class CatCiesUploadAPIView(CatalogPermissionMixin, ErrorMixin, APIView):
    catalog = "cies"
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        version = request.data.get("version")

        if not file or not version:
            return self._error(
                request, code="VALIDATION_ERROR",
                message="Archivo y versión son requeridos",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = PreviewCiesUseCase().execute(file=file, version=version)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CatCiesConfirmAPIView(CatalogPermissionMixin, ErrorMixin, APIView):
    catalog = "cies"

    def post(self, request):
        rows = request.data.get("rows", [])

        if not rows:
            return self._error(
                request, code="VALIDATION_ERROR",
                message="No se recibieron filas para importar",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = ConfirmCiesUseCase().execute(rows=rows, user_id=request.user.id)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CatCiesListCreateView(CatalogPermissionMixin, ErrorMixin, ListCreateAPIView):
    catalog = "cies"
    queryset = CatCies.objects.all()
    serializer_class = CatCiesSerializer


class CatCiesDetailView(CatalogPermissionMixin, ErrorMixin, RetrieveUpdateDestroyAPIView):
    catalog = "cies"
    queryset = CatCies.objects.all()
    serializer_class = CatCiesSerializer


# ---------------------------------------------------------------------------
# Excepciones de Centros de Atención
# ---------------------------------------------------------------------------

class CentrosAtencionExcepcionesListCreateView(CatalogBaseListCreateView):
    catalog = "centros_atencion_excepciones"
    model = CatCentroAtencionExcepcion
    list_serializer = CatCentroAtencionExcepcionListSerializer
    write_serializer = CatCentroAtencionExcepcionWriteSerializer
    name_field = "id"
    error_codes = MappingProxyType({"exists": "CARE_CENTER_EXCEPTION_EXISTS"})
    sort_map = MappingProxyType({
        "name": "date",
        "date": "date",
        "isActive": "is_active",
        "tipo": "tipo",
    })

    def get_queryset(self):
        qs = self.model.objects.select_related("center").all()
        params = self.request.query_params

        if center_id := params.get("centerId"):
            qs = qs.filter(center_id=center_id)

        if tipo := params.get("tipo"):
            qs = qs.filter(tipo=tipo)

        if date_from := params.get("dateFrom"):
            qs = qs.filter(date__gte=date_from)

        if date_to := params.get("dateTo"):
            qs = qs.filter(date__lte=date_to)

        if year := params.get("year"):
            qs = qs.filter(date__year=year)

        return qs.order_by("date")

    def post(self, request):
        serializer = self.write_serializer(data=request.data)
        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        vd = serializer.validated_data
        if self.model.objects.filter(
            center_id=vd["center_id"],
            date=vd["date"],
        ).exists():
            return self._error(
                request,
                code="CARE_CENTER_EXCEPTION_EXISTS",
                message="Ya existe una excepción para ese centro en esa fecha.",
                http_status=status.HTTP_409_CONFLICT,
                details={
                    "centerId": ["Duplicado"],
                    "date": ["Ya existe una excepción para esta fecha"],
                },
            )

        item = serializer.save(
            created_at=timezone.now(),
            created_by_id=_get_actor_id(request.user),
        )
        return Response(
            {"id": item.id, "name": str(item.date)},
            status=status.HTTP_201_CREATED,
        )


class CentrosAtencionExcepcionesDetailView(CatalogBaseDetailView):
    catalog = "centros_atencion_excepciones"
    model = CatCentroAtencionExcepcion
    detail_serializer = CatCentroAtencionExcepcionDetailSerializer
    write_serializer = CatCentroAtencionExcepcionWriteSerializer
    wrapper_key = "careCenterException"
    error_codes = MappingProxyType({
        "not_found": "CARE_CENTER_EXCEPTION_NOT_FOUND",
        "exists": "CARE_CENTER_EXCEPTION_EXISTS",
    })

    def put(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return self._error(
                request,
                code="CARE_CENTER_EXCEPTION_NOT_FOUND",
                message="Excepción no encontrada",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.write_serializer(item, data=request.data, partial=True)
        if not serializer.is_valid():
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Datos de entrada inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
            )

        vd = serializer.validated_data
        new_center_id = vd.get("center_id", item.center_id)
        new_date = vd.get("date", item.date)

        if self.model.objects.filter(
            center_id=new_center_id,
            date=new_date,
        ).exclude(pk=item.pk).exists():
            return self._error(
                request,
                code="CARE_CENTER_EXCEPTION_EXISTS",
                message="Ya existe una excepción para ese centro en esa fecha.",
                http_status=status.HTTP_409_CONFLICT,
                details={
                    "centerId": ["Duplicado"],
                    "date": ["Ya existe una excepción para esta fecha"],
                },
            )

        updated = serializer.save(
            updated_at=timezone.now(),
            updated_by_id=_get_actor_id(request.user),
        )
        return Response({"careCenterException": self.detail_serializer(updated).data})
    lookup_field = "code"