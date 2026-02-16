from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.utils import timezone
from types import MappingProxyType

from .models import *
from .serializers import *
from .permissions import CatalogPermissionMixin

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
            status=http_status,)

class CatalogBaseListCreateView(CatalogPermissionMixin, ErrorMixin, APIView):
    model = None
    list_serializer = None
    write_serializer = None
    error_codes = MappingProxyType ({})
    sort_map = MappingProxyType ({
        "name": "name",
        "isActive": "is_active",
    })

    def get_queryset(self):
        return self.model.objects.all()
     
    def get(self, request):
        qs = self.get_queryset()
        raw_page = request.query_params.get("page", "1")
        raw_page_size = request.query_params.get("pageSize", "20")

        try:
            page = int(raw_page)
            page_size = int(raw_page_size)
        
        except (TypeError, ValueError):
            return self._error(
                request,
                code="INVALID_FORMAT",
                message="Parámetros de paginación inválidos",
                http_status=status.HTTP_400_BAD_REQUEST,
                details={
                    "page": ["Debe ser un entero"],
                    "pageSize": ["Debe ser un entero"],
                },
            )

        if page < 1 or page_size < 1 or page_size > 100:
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Parámetros de paginación fuera de rango",
                http_status=status.HTTP_400_BAD_REQUEST,
                details={
                    "page": ["Debe ser mayor o igual a 1"],
                    "pageSize": ["Debe estar entre 1 y 100"],
                },
            )

        search = request.query_params.get("search")
        is_active = request.query_params.get("isActive")
        sort_by = request.query_params.get("sortBy", "name")
        sort_order = request.query_params.get("sortOrder", "asc")

        if sort_by not in self.sort_map:
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Parámetro sortBy inválido",
                http_status=status.HTTP_400_BAD_REQUEST,
                details={
                    "sortBy": [f"Campo inválido. Permitidos: {', '.join(self.sort_map.keys())}"],
                },
            )

        if sort_order not in ("asc", "desc"):
            return self._error(
                request,
                code="VALIDATION_ERROR",
                message="Parámetro sortOrder inválido",
                http_status=status.HTTP_400_BAD_REQUEST,
                details={
                    "sortOrder": ["Debe ser 'asc' o 'desc'"],
                },
            )

        if search:
            qs = qs.filter(Q(name__icontains=search))

        if is_active is not None:
            normalized_is_active = is_active.lower()
            if normalized_is_active not in ("true", "false"):
                return self._error(
                    request,
                    code="VALIDATION_ERROR",
                    message="Parámetro isActive inválido",
                    http_status=status.HTTP_400_BAD_REQUEST,
                    details={
                        "isActive": ["Debe ser 'true' o 'false'"],
                    },
                )
            qs = qs.filter(is_active=normalized_is_active == "true")

        order_field = self.sort_map[sort_by]
        if sort_order == "desc":
            order_field = f"-{order_field}"
        qs = qs.order_by(order_field)
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        serializer = self.list_serializer(qs[start:end], many=True)
        total_pages = (total + page_size - 1) // page_size
        return Response(
            {
                "items": serializer.data,
                "page": page,
                "pageSize": page_size,
                "total": total,
                "totalPages": total_pages,
            },
            status=status.HTTP_200_OK,
        )
   
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
        name = serializer.validated_data.get("name")
        if name and self.model.objects.filter(name=name).exists():
            return self._error(
                request,
                code=self.error_codes.get("exists", "ITEM_EXISTS"),
                message="Duplicado",
                http_status=status.HTTP_409_CONFLICT,
                details={"name": ["Duplicado"]},
            )
        item = serializer.save(created_at=timezone.now(), created_by_id=request.user.id)
        return Response({"id": item.id, "name": item.name}, status=status.HTTP_201_CREATED)



class CatalogBaseDetailView(CatalogPermissionMixin, ErrorMixin, APIView):
    model = None
    detail_serializer = None
    write_serializer = None
    wrapper_key = None
    error_codes = MappingProxyType({})
    
    def get_object(self, pk):
        return self.model.objects.filter(id=pk).first()
    
    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return self._error(
                request,
                code=self.error_codes.get("not_found", "ITEM_NOT_FOUND"),
                message="No encontrado",
                http_status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.detail_serializer(item)
        return Response({self.wrapper_key: serializer.data}, status=status.HTTP_200_OK)
    
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
        name = serializer.validated_data.get("name")
        if name and self.model.objects.filter(name=name).exclude(id=item.id).exists():
            return self._error(
                request,
                code=self.error_codes.get("exists", "ITEM_EXISTS"),
                message="Duplicado",
                http_status=status.HTTP_409_CONFLICT,
                details={"name": ["Duplicado"]},
            )
        item = serializer.save(updated_at=timezone.now(), updated_by_id=request.user.id)
        detail = self.detail_serializer(item)
        return Response({self.wrapper_key: detail.data}, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return self._error(
                request,
                code=self.error_codes.get("not_found", "ITEM_NOT_FOUND"),
                message="No encontrado",
                http_status=status.HTTP_404_NOT_FOUND,
            )
        item.is_active = False
        item.deleted_at = timezone.now()
        item.deleted_by_id = request.user.id
        item.save(update_fields=["is_active", "deleted_at", "deleted_by_id"])
        return Response({"success": True}, status=status.HTTP_200_OK)


#####Views Areas
class AreasListCreateView(CatalogBaseListCreateView):
    #catalog = "areas"
    model = Areas
    list_serializer = AreasListSerializer
    write_serializer = AreasWriteSerializer
    error_codes = {"exists": "AREAS_EXISTS"}
    
class AreasDetailView(CatalogBaseDetailView):
    #catalog = "areas"
    model = Areas
    detail_serializer = AreasDetailSerializer
    write_serializer = AreasWriteSerializer
    wrapper_key = "area"
    error_codes = {"not_found": "AREAS_NOT_FOUND", "exists": "AREAS_EXISTS"}


#####Views Autorizadores
class AutorizadoresListCreateView(CatalogBaseListCreateView):
    catalog = "autorizadores"
    model = Autorizadores
    list_serializer = AutorizadoresListSerializer
    write_serializer = AutorizadoresWriteSerializer
    error_codes = {"exists": "AUTHORIZER_STUDIES_EXISTS"}
    
class AutorizadoresDetailView(CatalogBaseDetailView):
    catalog = "autorizadores"
    model = Autorizadores
    detail_serializer = AutorizadoresDetailSerializer
    write_serializer = AutorizadoresWriteSerializer
    wrapper_key = "authorizer"
    error_codes = {"not_found": "AUTHORIZER_NOT_FOUND", "exists": "AUTHORIZER_STUDIES_EXISTS"}


#####Views Bajas
class BajasListCreateView(CatalogBaseListCreateView):
    catalog = "bajas"
    model = Bajas
    list_serializer = BajasListSerializer
    write_serializer = BajasWriteSerializer
    error_codes = {"exists": "DISCHARGE_REASON_EXISTS"}
    
class BajasDetailView(CatalogBaseDetailView):
    catalog = "bajas"
    model = Bajas
    detail_serializer = BajasDetailSerializer
    write_serializer = BajasWriteSerializer
    wrapper_key = "dischargeReason"
    error_codes = {"not_found": "DISCHARGE_REASON_NOT_FOUND", "exists": "DISCHARGE_REASON_EXISTS"}


#####Views CalidadLaboral
class CalidadLaboralListCreateView(CatalogBaseListCreateView):
    catalog = "calidad_laboral"
    model = CalidadLaboral
    list_serializer = CalidadLaboralListSerializer
    write_serializer = CalidadLaboralWriteSerializer
    error_codes = {"exists": "LABOR_QUALITY_EXISTS"}
    
class CalidadLaboralDetailView(CatalogBaseDetailView):
    catalog = "calidad_laboral"
    model = CalidadLaboral
    detail_serializer = CalidadLaboralDetailSerializer
    write_serializer = CalidadLaboralWriteSerializer
    wrapper_key = "laborQuality"
    error_codes = {"not_found": "LABOR_QUALITY_NOT_FOUND", "exists": "LABOR_QUALITY_EXISTS"}


#####Views Centros de Atencion
class CentrosAtencionListCreateView(CatalogBaseListCreateView):
    catalog = "centros_atencion"
    model = CatCentroAtencion
    list_serializer = CatCentroAtencionListSerializer
    write_serializer = CatCentroAtencionWriteSerializer
    error_codes = {"exists": "CARE_CENTER_EXISTS"}
    
class CentrosAtencionDetailView(CatalogBaseDetailView):
    catalog = "centros_atencion"
    model = CatCentroAtencion
    detail_serializer = CatCentroAtencionDetailSerializer
    write_serializer = CatCentroAtencionWriteSerializer
    wrapper_key = "careCenter"
    error_codes = {"not_found": "CARE_CENTER_NOT_FOUND", "exists": "CARE_CENTER_EXISTS"}


#####Views Consultorios
class ConsultoriosListCreateView(CatalogBaseListCreateView):
    catalog = "consultorios"
    model = Consultorios
    list_serializer = ConsultoriosListSerializer
    write_serializer = ConsultoriosWriteSerializer
    error_codes = {"exists": "CONSULTING_ROOM_EXISTS"}
    
class ConsultoriosDetailView(CatalogBaseDetailView):
    catalog = "consultorios"
    model = Consultorios
    detail_serializer = ConsultoriosDetailSerializer
    write_serializer = ConsultoriosWriteSerializer
    wrapper_key = "consultingRoom"
    error_codes = {"not_found": "CONSULTING_ROOM_NOT_FOUND", "exists": "CONSULTING_ROOM_EXISTS"} 


#####Views EdoCivil
class EdoCivilListCreateView(CatalogBaseListCreateView):
    catalog = "edo_civil"
    model = EdoCivil
    list_serializer = EdoCivilListSerializer
    write_serializer = EdoCivilWriteSerializer
    error_codes = {"exists": "CIVIL_STATUS_EXISTS"}
    
class EdoCivilDetailView(CatalogBaseDetailView):
    catalog = "edo_civil"
    model = EdoCivil
    detail_serializer = EdoCivilDetailSerializer
    write_serializer = EdoCivilWriteSerializer
    wrapper_key = "civilStatus"
    error_codes = {"not_found": "CIVIL_STATUS_NOT_FOUND", "exists": "CIVIL_STATUS_EXISTS"}


#####Views Enfermedades
class EnfermedadesListCreateView(CatalogBaseListCreateView):
    catalog = "enfermedades"
    model = Enfermedades
    list_serializer = EnfermedadesListSerializer
    write_serializer = EnfermedadesWriteSerializer
    error_codes = {"exists": "DISEASE_EXISTS"}
    
class EnfermedadesDetailView(CatalogBaseDetailView):
    catalog = "enfermedades"
    model = Enfermedades
    detail_serializer = EnfermedadesDetailSerializer
    write_serializer = EnfermedadesWriteSerializer
    wrapper_key = "disease"
    error_codes = {"not_found": "DISEASE_NOT_FOUND", "exists": "DISEASE_EXISTS"}


#####Views Escolaridad
class EscolaridadListCreateView(CatalogBaseListCreateView):
    catalog = "escolaridad"
    model = Escolaridad
    list_serializer = EscolaridadListSerializer
    write_serializer = EscolaridadWriteSerializer
    error_codes = {"exists": "EDUCATION_LEVEL_EXISTS"}
    
class EscolaridadDetailView(CatalogBaseDetailView):
    catalog = "escolaridad"
    model = Escolaridad
    detail_serializer = EscolaridadDetailSerializer
    write_serializer = EscolaridadWriteSerializer
    wrapper_key = "educationLevel"
    error_codes = {"not_found": "EDUCATION_LEVEL_NOT_FOUND", "exists": "EDUCATION_LEVEL_EXISTS"}


#####Views Escuelas
class EscuelasListCreateView(CatalogBaseListCreateView):
    catalog = "escuelas"
    model = Escuelas
    list_serializer = EscuelasListSerializer
    write_serializer = EscuelasWriteSerializer
    error_codes = {"exists": "SCHOOL_EXISTS"}
    
class EscuelasDetailView(CatalogBaseDetailView):
    catalog = "escuelas"
    model = Escuelas
    detail_serializer = EscuelasDetailSerializer
    write_serializer = EscuelasWriteSerializer
    wrapper_key = "school"
    error_codes = {"not_found": "SCHOOL_NOT_FOUND", "exists": "SCHOOL_EXISTS"}


#####Views Especialidades
class EspecialidadesListCreateView(CatalogBaseListCreateView):
    catalog = "especialidades"
    model = Especialidades
    list_serializer = EspecialidadesListSerializer
    write_serializer = EspecialidadesWriteSerializer
    error_codes = {"exists": "SPECIALTY_EXISTS"}
    
class EspecialidadesDetailView(CatalogBaseDetailView):
    catalog = "especialidades"
    model = Especialidades
    detail_serializer = EspecialidadesDetailSerializer
    write_serializer = EspecialidadesWriteSerializer
    wrapper_key = "specialty"
    error_codes = {"not_found": "SPECIALTY_NOT_FOUND", "exists": "SPECIALTY_EXISTS"}


#####Views Estudios Medicos
class EstudiosMedListCreateView(CatalogBaseListCreateView):
    catalog = "estudios_med"
    model = EstudiosMed
    list_serializer = EstudiosMedListSerializer
    write_serializer = EstudiosMedWriteSerializer
    error_codes = {"exists": "MEDICAL_STUDIES_EXISTS"}
    
class EstudiosMedDetailView(CatalogBaseDetailView):
    catalog = "estudios_med"
    model = EstudiosMed
    detail_serializer = EstudiosMedDetailSerializer
    write_serializer = EstudiosMedWriteSerializer
    wrapper_key = "medicalStudy"
    error_codes = {"not_found": "MEDICAL_STUDIES_NOT_FOUND", "exists": "MEDICAL_STUDIES_EXISTS"}


#####Views GruposDeMedicamentos
class GruposDeMedicamentosListCreateView(CatalogBaseListCreateView):
    catalog = "grupos_medicamentos"
    model = GruposDeMedicamentos
    list_serializer = GruposDeMedicamentosListSerializer
    write_serializer = GruposDeMedicamentosWriteSerializer
    error_codes = {"exists": "MED_GROUP_EXISTS"}
    
class GruposDeMedicamentosDetailView(CatalogBaseDetailView):
    catalog = "grupos_medicamentos"
    model = GruposDeMedicamentos
    detail_serializer = GruposDeMedicamentosDetailSerializer
    write_serializer = GruposDeMedicamentosWriteSerializer
    wrapper_key = "medicationGroup"
    error_codes = {"not_found": "MED_GROUP_NOT_FOUND", "exists": "MED_GROUP_EXISTS"}


#####Views Ocupaciones
class OcupacionesListCreateView(CatalogBaseListCreateView):
    catalog = "ocupaciones"
    model = Ocupaciones
    list_serializer = OcupacionesListSerializer
    write_serializer = OcupacionesWriteSerializer
    error_codes = {"exists": "OCCUPATIONS_EXISTS"}
    
class OcupacionesDetailView(CatalogBaseDetailView):
    catalog = "ocupaciones"
    model = Ocupaciones
    detail_serializer = OcupacionesDetailSerializer
    write_serializer = OcupacionesWriteSerializer
    wrapper_key = "occupation"
    error_codes = {"not_found": "OCCUPATIONS_NOT_FOUND", "exists": "OCCUPATIONS_EXISTS"}


##### Views OrigenCons
class OrigenConsListCreateView(CatalogBaseListCreateView):
    catalog = "origen_cons"
    model = OrigenCons
    list_serializer = OrigenConsListSerializer
    write_serializer = OrigenConsWriteSerializer
    error_codes = {"exists": "CONSULTATION_ORIGIN_EXISTS"}

class OrigenConsDetailView(CatalogBaseDetailView):
    catalog = "origen_cons"
    model = OrigenCons
    detail_serializer = OrigenConsDetailSerializer
    write_serializer = OrigenConsWriteSerializer
    wrapper_key = "consultationOrigin"
    error_codes = {"not_found": "CONSULTATION_ORIGIN_NOT_FOUND", "exists": "CONSULTATION_ORIGIN_EXISTS"}


#####Views Parentesco
class ParentescoListCreateView(CatalogBaseListCreateView):
    catalog = "parentescos"
    model = Parentesco
    list_serializer = ParentescoListSerializer
    write_serializer = ParentescoWriteSerializer
    error_codes = {"exists": "KINSHIP_EXISTS"}
    
class ParentescoDetailView(CatalogBaseDetailView):
    catalog = "parentescos"
    model = Parentesco
    detail_serializer = ParentescoDetailSerializer
    write_serializer = ParentescoWriteSerializer
    wrapper_key = "kinship"
    error_codes = {"not_found": "KINSHIP_NOT_FOUND", "exists": "KINSHIP_EXISTS"}


#####Views Pases
class PasesListCreateView(CatalogBaseListCreateView):
    catalog = "pases"
    model = Pases
    list_serializer = PasesListSerializer
    write_serializer = PasesWriteSerializer
    error_codes = {"exists": "PASS_EXISTS"}
    
class PasesDetailView(CatalogBaseDetailView):
    catalog = "pases"
    model = Pases
    detail_serializer = PasesDetailSerializer
    write_serializer = PasesWriteSerializer
    wrapper_key = "pass"
    error_codes = {"not_found": "PASS_NOT_FOUND", "exists": "PASS_EXISTS"}


#####Views Permisos
class PermisosListCreateView(CatalogBaseListCreateView):
    catalog = "permisos"
    model = Permisos
    list_serializer = PermisosListSerializer
    write_serializer = PermisosWriteSerializer
    error_codes = {"exists": "PERMISSIONS_EXISTS"}
    
class PermisosDetailView(CatalogBaseDetailView):
    catalog = "permisos"
    model = Permisos
    detail_serializer = PermisosDetailSerializer
    write_serializer = PermisosWriteSerializer
    wrapper_key = "permission"
    error_codes = {"not_found": "PERMISSIONS_NOT_FOUND", "exists": "PERMISSIONS_EXISTS"}


#####Views Roles
class RolesListCreateView(CatalogBaseListCreateView):
    catalog = "roles"
    model = Roles
    list_serializer = RolesListSerializer
    write_serializer = RolesWriteSerializer
    error_codes = {"exists": "ROLE_EXISTS"}
    
class RolesDetailView(CatalogBaseDetailView):
    catalog = "roles"
    model = Roles
    detail_serializer = RolesDetailSerializer
    write_serializer = RolesWriteSerializer
    wrapper_key = "role"
    error_codes = {"not_found": "ROLE_NOT_FOUND", "exists": "ROLE_EXISTS"}


#####Views Tipos de Areas
class TiposAreasListCreateView(CatalogBaseListCreateView):
    catalog = "tipos_areas"
    model = TiposAreas
    list_serializer = TiposAreasListSerializer
    write_serializer = TiposAreasWriteSerializer
    error_codes = {"exists": "AREA_TYPE_EXISTS"}
    
class TiposAreasDetailView(CatalogBaseDetailView):
    catalog = "tipos_areas"
    model = TiposAreas
    detail_serializer = TiposAreasDetailSerializer
    write_serializer = TiposAreasWriteSerializer
    wrapper_key = "areaType"
    error_codes = {"not_found": "AREA_TYPE_NOT_FOUND", "exists": "AREA_TYPE_EXISTS"}


#####Views Tipo de Autorizacion
class TpAutorizacionListCreateView(CatalogBaseListCreateView):
    catalog = "tp_autorizacion"
    model = TpAutorizacion
    list_serializer = TpAutorizacionListSerializer
    write_serializer = TpAutorizacionWriteSerializer
    error_codes = {"exists": "AUTH_TYPE_STUDIES_EXISTS"}
    
class TpAutorizacionDetailView(CatalogBaseDetailView):
    catalog = "tp_autorizacion"
    model = TpAutorizacion
    detail_serializer = TpAutorizacionDetailSerializer
    write_serializer = TpAutorizacionWriteSerializer
    wrapper_key = "authorizationType"
    error_codes = {"not_found": "AUTH_TYPE_NOT_FOUND", "exists": "AUTH_TYPE_STUDIES_EXISTS"}


#####Views TipoDeCitas
class TipoDeCitasListCreateView(CatalogBaseListCreateView):
    catalog = "tipo_citas"
    model = TipoDeCitas
    list_serializer = TipoDeCitasListSerializer
    write_serializer = TipoDeCitasWriteSerializer
    error_codes = {"exists": "APPOINTMENT_TYPE_EXISTS"}
    
class TipoDeCitasDetailView(CatalogBaseDetailView):
    catalog = "tipo_citas"
    model = TipoDeCitas
    detail_serializer = TipoDeCitasDetailSerializer
    write_serializer = TipoDeCitasWriteSerializer
    wrapper_key = "appointmentType"
    error_codes = {"not_found": "APPOINTMENT_TYPE_NOT_FOUND", "exists": "APPOINTMENT_TYPE_EXISTS"}    


#####Views Licencias
class LicenciasListCreateView(CatalogBaseListCreateView):
    catalog = "licencias"
    model = Licencias
    list_serializer = LicenciasListSerializer
    write_serializer = LicenciasWriteSerializer
    error_codes = {"exists": "LICENSE_EXISTS"}
    
class LicenciasDetailView(CatalogBaseDetailView):
    catalog = "licencias"
    model = Licencias
    detail_serializer = LicenciasDetailSerializer
    write_serializer = LicenciasWriteSerializer
    wrapper_key = "license"
    error_codes = {"not_found": "LICENSE_NOT_FOUND", "exists": "LICENSE_EXISTS"}


#####Views TiposSanguineo
class TiposSanguineoListCreateView(CatalogBaseListCreateView):
    catalog = "tipos_sanguineo"
    model = TiposSanguineo
    list_serializer = TiposSanguineoListSerializer
    write_serializer = TiposSanguineoWriteSerializer
    error_codes = {"exists": "BLOOD_TYPE_EXISTS"}
    
class TiposSanguineoDetailView(CatalogBaseDetailView):
    catalog = "tipos_sanguineo"
    model = TiposSanguineo
    detail_serializer = TiposSanguineoDetailSerializer
    write_serializer = TiposSanguineoWriteSerializer
    wrapper_key = "bloodType"
    error_codes = {"not_found": "BLOOD_TYPE_NOT_FOUND", "exists": "BLOOD_TYPE_EXISTS"}


#####Views Turnos
class TurnosListCreateView(CatalogBaseListCreateView):
    catalog = "turnos"
    model = Turnos
    list_serializer = TurnosListSerializer
    write_serializer = TurnosWriteSerializer
    error_codes = {"exists": "SHIFT_EXISTS"}
    
class TurnosDetailView(CatalogBaseDetailView):
    catalog = "turnos"
    model = Turnos
    detail_serializer = TurnosDetailSerializer
    write_serializer = TurnosWriteSerializer
    wrapper_key = "shift"
    error_codes = {"not_found": "SHIFT_NOT_FOUND", "exists": "SHIFT_EXISTS"}
