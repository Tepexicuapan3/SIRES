# importar DRF serializers
from rest_framework import serializers
from apps.authentication.repositories.user_repository import UserRepository
from datetime import timezone as dt_timezone

# importar el modelo
from .models import (
    CatCentroAtencion,
    Areas,
    Autorizadores,
    Bajas,
    CalidadLaboral,
    Consultorios,
    EdoCivil,
    Enfermedades,
    Escolaridad,
    Escuelas,
    Especialidades,
    EstudiosMed,
    GruposDeMedicamentos,
    Ocupaciones,
    OrigenCons,
    Parentesco,
    Pases,
    Permisos,
    Roles,
    TiposAreas,
    TpAutorizacion,
    TipoDeCitas,
    Licencias,
    TiposSanguineo,
    Turnos,
)


class CatalogListSerializer(serializers.ModelSerializer):
    isActive = serializers.BooleanField(source="is_active")

    class Meta:
        abstract = True
        fields = ("id", "name", "isActive")


class CatalogDetailSerializer(serializers.ModelSerializer):
    isActive = serializers.BooleanField(source="is_active")
    createdAt = serializers.DateTimeField(source="created_at", format="%Y-%m-%dT%H:%M:%SZ")
    createdBy = serializers.SerializerMethodField()
    updatedAt = serializers.DateTimeField(source="updated_at", format="%Y-%m-%dT%H:%M:%SZ")
    updatedBy = serializers.SerializerMethodField()

    class Meta:
        abstract = True
        fields = (
            "id",
            "name",
            "isActive",
            "createdAt",
            "createdBy",
            "updatedAt",
            "updatedBy",
        )

    def _build_user_ref(self, user_id):
        if not user_id:
            return None
        user = UserRepository.get_by_id(user_id)
        if not user:
            return {"id": user_id, "name": ""}
        # Case 1: repository returns DetUsuarios
        if hasattr(user, "nombre") and hasattr(user, "paterno"):
            name = " ".join([user.nombre, user.paterno, user.materno or ""]).strip()
            sy_user = getattr(user, "id_usuario", None)  # FK/OneToOne to SyUsuarios
            if not name:
                name = getattr(sy_user, "usuario", "")
            resolved_id = getattr(sy_user, "id_usuario", None) or user_id
            return {"id": resolved_id, "name": name}
        # Case 2: repository returns SyUsuarios
        profile = getattr(user, "detalle", None) or getattr(user, "syusuarios", None)
        if profile:
            name = " ".join([profile.nombre, profile.paterno, profile.materno or ""]).strip()
        else:
            name = getattr(user, "usuario", "")
        resolved_id = getattr(user, "id_usuario", None) or getattr(user, "id", None) or user_id
        return {"id": resolved_id, "name": name}

    def get_createdBy(self, obj):
        return self._build_user_ref(obj.created_by_id)

    def get_updatedBy(self, obj):
        return self._build_user_ref(obj.updated_by_id)


class CatalogWriteSerializer(serializers.ModelSerializer):
    isActive = serializers.BooleanField(source="is_active", required=False)

    class Meta:
        fields = ("name", "isActive")


class CatalogDetailWithCodeSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        fields = CatalogDetailSerializer.Meta.fields + ("code",)


class CatalogListWithCodeSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        fields = CatalogListSerializer.Meta.fields + ("code",)


class CatalogRefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


#######Centros Atencion
class CatCentroAtencionListSerializer(CatalogListSerializer):
    isExternal = serializers.BooleanField(source="is_external")

    class Meta(CatalogListSerializer.Meta):
        model = CatCentroAtencion
        fields = ("id", "name", "code", "isExternal", "isActive")

class CatCentroAtencionDetailSerializer(CatalogDetailSerializer):
    isExternal = serializers.BooleanField(source="is_external")
    
    class Meta(CatalogDetailSerializer.Meta):
        model = CatCentroAtencion
        fields = (
            "id",
            "name",
            "code",
            "isExternal",
            "address",
            "schedule",
            "isActive",
            "createdAt",
            "createdBy",
            "updatedAt",
            "updatedBy",
        )

class CatCentroAtencionWriteSerializer(CatalogWriteSerializer):
    isExternal = serializers.BooleanField(source="is_external", required=False)
    
    class Meta(CatalogWriteSerializer.Meta):
        model = CatCentroAtencion
        fields = ("name", "code", "isExternal", "address", "schedule", "isActive")


#######Areas
class AreasListSerializer(CatalogListWithCodeSerializer):
    class Meta(CatalogListWithCodeSerializer.Meta):
        model = Areas

class AreasDetailSerializer(CatalogDetailWithCodeSerializer):
    class Meta(CatalogDetailWithCodeSerializer.Meta):
        model = Areas

class AreasWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Areas
        fields = ("name", "code", "isActive")


#######Autorizadores
class AutorizadoresListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Autorizadores
        
class AutorizadoresDetailSerializer(CatalogDetailSerializer):
    center = serializers.SerializerMethodField()
    authorizationType = serializers.SerializerMethodField()
    signatureImage = serializers.CharField(source="signature_image", allow_null=True, required=False, allow_blank=True)
    user = serializers.SerializerMethodField()
    fileNumber = serializers.CharField(source="file_number", allow_null=True, required=False, allow_blank=True)

    def _build_catalog_ref(self, ref_id, queryset):
        if not ref_id:
            return None
        item = queryset.filter(pk=ref_id).only("id", "name").first()
        return {"id": ref_id, "name": item.name if item else ""}


    def get_center(self, obj):
        return self._build_catalog_ref(obj.center_id, CatCentroAtencion.objects)

    def get_authorizationType(self, obj):
        return self._build_catalog_ref(obj.authorization_type_id, TpAutorizacion.objects)

    def get_user(self, obj):
        return self._build_user_ref(obj.user_id)

    class Meta(CatalogDetailSerializer.Meta):
        model = Autorizadores
        fields = CatalogDetailSerializer.Meta.fields + (
            "position",
            "center",
            "authorizationType",
            "signatureImage",
            "user",
            "fileNumber",
    )

class AutorizadoresWriteSerializer(CatalogWriteSerializer):
    centerId = serializers.IntegerField(source="center_id")
    authorizationTypeId = serializers.IntegerField(source="authorization_type_id")
    signatureImage = serializers.CharField(source="signature_image", allow_null=True, required=False, allow_blank=True)
    authorizerPassword = serializers.CharField(source="authorizer_password", write_only=True)
    userId = serializers.IntegerField(source="user_id")
    fileNumber = serializers.CharField(source="file_number", allow_null=True, required=False, allow_blank=True)
    class Meta(CatalogWriteSerializer.Meta):
        model = Autorizadores
        fields = CatalogWriteSerializer.Meta.fields + (
            "centerId",
            "position",
            "authorizationTypeId",
            "signatureImage",
            "authorizerPassword",
            "userId",
            "fileNumber",
    )


#######Bajas
class BajasListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Bajas

class BajasDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Bajas

class BajasWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Bajas


#######CalidadLaboral
class CalidadLaboralListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = CalidadLaboral

class CalidadLaboralDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = CalidadLaboral

class CalidadLaboralWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = CalidadLaboral
        fields = ("id",) + CatalogWriteSerializer.Meta.fields


#######Consultorios
class ConsultoriosListSerializer(CatalogListWithCodeSerializer):
    class Meta(CatalogListWithCodeSerializer.Meta):
        model = Consultorios

class ConsultoriosDetailSerializer(CatalogDetailWithCodeSerializer):
    turn = CatalogRefSerializer(source="id_turn", read_only=True)
    center = CatalogRefSerializer(source="id_center", read_only=True)
    class Meta(CatalogDetailWithCodeSerializer.Meta):
        model = Consultorios
        fields = CatalogDetailWithCodeSerializer.Meta.fields + (
            "turn",
            "center",
        )

class ConsultoriosWriteSerializer(CatalogWriteSerializer):
    code = serializers.IntegerField()
    idTurn = serializers.IntegerField(source="id_turn_id")
    idCenter = serializers.IntegerField(source="id_center_id")

    class Meta(CatalogWriteSerializer.Meta):
        model = Consultorios
        fields = CatalogWriteSerializer.Meta.fields + ("code", "idTurn", "idCenter")


#######EdoCivil
class EdoCivilListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = EdoCivil

class EdoCivilDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = EdoCivil

class EdoCivilWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = EdoCivil    


#######Enfermedades
class EnfermedadesListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Enfermedades

class EnfermedadesDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Enfermedades

class EnfermedadesWriteSerializer(CatalogWriteSerializer):
    cieVersion = serializers.CharField(source="cie_version")

    class Meta(CatalogWriteSerializer.Meta):
        model = Enfermedades
        fields = CatalogWriteSerializer.Meta.fields + ("code", "cieVersion")


#######Escolaridad
class EscolaridadListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Escolaridad

class EscolaridadDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Escolaridad

class EscolaridadWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Escolaridad     


#######Escuelas
class EscuelasListSerializer(CatalogListWithCodeSerializer):
    class Meta(CatalogListWithCodeSerializer.Meta):
        model = Escuelas

class EscuelasDetailSerializer(CatalogDetailWithCodeSerializer):
    class Meta(CatalogDetailWithCodeSerializer.Meta):
        model = Escuelas

class EscuelasWriteSerializer(CatalogWriteSerializer):
    code = serializers.CharField()
    class Meta(CatalogWriteSerializer.Meta):
        model = Escuelas
        fields = ("name", "code", "isActive")


#######Especialidades
class EspecialidadesListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Especialidades

class EspecialidadesDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Especialidades

class EspecialidadesWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Especialidades


#######Estudios Médicos
class EstudiosMedListSerializer(CatalogListWithCodeSerializer):
    class Meta(CatalogListWithCodeSerializer.Meta):
        model = EstudiosMed

class EstudiosMedDetailSerializer(CatalogDetailWithCodeSerializer):
    class Meta(CatalogDetailWithCodeSerializer.Meta):
        model = EstudiosMed

class EstudiosMedWriteSerializer(CatalogWriteSerializer):
    studyType = serializers.CharField(source="study_type")

    class Meta(CatalogWriteSerializer.Meta):
        model = EstudiosMed
        fields = CatalogWriteSerializer.Meta.fields + ("studyType", "indication")

        
#######Grupos de Medicamentos
class GruposDeMedicamentosListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = GruposDeMedicamentos

class GruposDeMedicamentosDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = GruposDeMedicamentos

class GruposDeMedicamentosWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = GruposDeMedicamentos


#######Ocupaciones
class OcupacionesListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Ocupaciones

class OcupacionesDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Ocupaciones

class OcupacionesWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Ocupaciones


#######Origen consultas
class OrigenConsListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = OrigenCons

class OrigenConsDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = OrigenCons

class OrigenConsWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = OrigenCons
        fields = ("id",) + CatalogWriteSerializer.Meta.fields


#######Parentesco
class ParentescoListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Parentesco

class ParentescoDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Parentesco

class ParentescoWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Parentesco
        fields = ("id",) + CatalogWriteSerializer.Meta.fields


#######Pases
class PasesListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Pases

class PasesDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Pases

class PasesWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Pases       


#######Permisos
class PermisosListSerializer(CatalogListWithCodeSerializer):
    class Meta(CatalogListWithCodeSerializer.Meta):
        model = Permisos
                
class PermisosDetailSerializer(CatalogDetailWithCodeSerializer):
    isSystem = serializers.BooleanField(source="is_system")
    class Meta(CatalogDetailWithCodeSerializer.Meta):
        model = Permisos
        fields = CatalogDetailWithCodeSerializer.Meta.fields + (
            "isSystem",
            "isActive",
            "createdAt",
            "createdBy",
            "updatedAt",
            "updatedBy",
        )

class PermisosWriteSerializer(CatalogWriteSerializer):
    isSystem = serializers.BooleanField(source="is_system", required=False)
    code = serializers.CharField()

    class Meta(CatalogWriteSerializer.Meta):
        model = Permisos
        fields = CatalogWriteSerializer.Meta.fields + ("code", "isSystem")


#######Roles
class RolesListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Roles

class RolesDetailSerializer(CatalogDetailSerializer):
    landingRoute = serializers.CharField(source="landing_route")
    isAdmin = serializers.BooleanField(source="is_admin")
    isSystem = serializers.BooleanField(source="is_system")
    class Meta(CatalogDetailSerializer.Meta):
        model = Roles
        fields = CatalogDetailSerializer.Meta.fields + (
            "description",
            "landingRoute",
            "isAdmin",
            "isSystem",
        )

class RolesWriteSerializer(CatalogWriteSerializer):
    landingRoute = serializers.CharField(source="landing_route")
    isAdmin = serializers.BooleanField(source="is_admin", required=False)
    isSystem = serializers.BooleanField(source="is_system", required=False)

    class Meta(CatalogWriteSerializer.Meta):
        model = Roles
        fields = CatalogWriteSerializer.Meta.fields + ("description", "landingRoute", "isAdmin", "isSystem")


#######Tipo de areas
class TiposAreasListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = TiposAreas

class TiposAreasDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = TiposAreas

class TiposAreasWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = TiposAreas


#######TpAutorizacion
class TpAutorizacionListSerializer(CatalogListWithCodeSerializer):
    class Meta(CatalogListWithCodeSerializer.Meta):
        model = TpAutorizacion

class TpAutorizacionDetailSerializer(CatalogDetailWithCodeSerializer):
    class Meta(CatalogDetailWithCodeSerializer.Meta):
        model = TpAutorizacion

class TpAutorizacionWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = TpAutorizacion
        fields = CatalogWriteSerializer.Meta.fields + ("code",)


#######Tipo de citas
class TipoDeCitasListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = TipoDeCitas

class TipoDeCitasDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = TipoDeCitas

class TipoDeCitasWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = TipoDeCitas


#######Licencias
class LicenciasListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Licencias

class LicenciasDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Licencias

class LicenciasWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Licencias


#######Tipos sanguineos
class TiposSanguineoListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = TiposSanguineo

class TiposSanguineoDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = TiposSanguineo

class TiposSanguineoWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = TiposSanguineo


#######Turnos
class TurnosListSerializer(CatalogListSerializer):
    class Meta(CatalogListSerializer.Meta):
        model = Turnos

class TurnosDetailSerializer(CatalogDetailSerializer):
    class Meta(CatalogDetailSerializer.Meta):
        model = Turnos

class TurnosWriteSerializer(CatalogWriteSerializer):
    class Meta(CatalogWriteSerializer.Meta):
        model = Turnos


