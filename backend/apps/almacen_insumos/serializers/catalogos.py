from rest_framework import serializers

from apps.catalogos.models import CatCentroAtencion
from ..models.catalogos import Almacen, CatCategoriaInsumo, CatInsumo, CatProveedor, CatUnidadMedida


class CatUnidadMedidaSerializer(serializers.ModelSerializer):
    id        = serializers.IntegerField(source="pk", read_only=True)
    isActive  = serializers.BooleanField(source="is_active", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model            = CatUnidadMedida
        fields           = ["id", "nombre", "abreviacion", "isActive", "createdAt"]
        read_only_fields = ["id", "createdAt"]


class CatCategoriaInsumoSerializer(serializers.ModelSerializer):
    id        = serializers.IntegerField(source="pk", read_only=True)
    isActive  = serializers.BooleanField(source="is_active", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model            = CatCategoriaInsumo
        fields           = ["id", "nombre", "descripcion", "isActive", "createdAt"]
        read_only_fields = ["id", "createdAt"]


class CatProveedorSerializer(serializers.ModelSerializer):
    id        = serializers.IntegerField(source="pk", read_only=True)
    isActive  = serializers.BooleanField(source="is_active", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model            = CatProveedor
        fields           = ["id", "nombre", "contacto", "telefono", "correo", "direccion", "rfc", "isActive", "createdAt"]
        read_only_fields = ["id", "createdAt"]


class CatInsumoSerializer(serializers.ModelSerializer):
    id                = serializers.IntegerField(source="pk", read_only=True)
    codigoBarras      = serializers.CharField(source="codigo_barras", required=False, allow_blank=True)
    idCategoria       = serializers.PrimaryKeyRelatedField(
        source="id_categoria",
        queryset=CatCategoriaInsumo.objects.filter(is_active=True),
    )
    categoriaLabel    = serializers.SerializerMethodField()
    idUnidad          = serializers.PrimaryKeyRelatedField(
        source="id_unidad",
        queryset=CatUnidadMedida.objects.filter(is_active=True),
    )
    unidadLabel       = serializers.SerializerMethodField()
    stockMinimo       = serializers.DecimalField(source="stock_minimo", max_digits=12, decimal_places=4, required=False)
    requiereLote      = serializers.BooleanField(source="requiere_lote", required=False)
    requiereCaducidad = serializers.BooleanField(source="requiere_caducidad", required=False)
    isActive          = serializers.BooleanField(source="is_active", required=False)
    createdAt         = serializers.DateTimeField(source="created_at", read_only=True)

    def get_categoriaLabel(self, obj) -> str:
        return obj.id_categoria.nombre if obj.id_categoria_id else ""

    def get_unidadLabel(self, obj) -> str:
        if not obj.id_unidad_id:
            return ""
        u = obj.id_unidad
        return f"{u.nombre} ({u.abreviacion})"

    class Meta:
        model            = CatInsumo
        fields           = [
            "id", "nombre", "codigo", "codigoBarras", "descripcion",
            "idCategoria", "categoriaLabel", "idUnidad", "unidadLabel",
            "stockMinimo", "requiereLote", "requiereCaducidad",
            "isActive", "createdAt",
        ]
        read_only_fields = ["id", "categoriaLabel", "unidadLabel", "createdAt"]


class AlmacenSerializer(serializers.ModelSerializer):
    id               = serializers.IntegerField(source="pk", read_only=True)
    idCentroAtencion = serializers.PrimaryKeyRelatedField(
        source="id_centro_atencion",
        queryset=CatCentroAtencion.objects.filter(is_active=True),
    )
    centroLabel  = serializers.SerializerMethodField()
    tipoLabel    = serializers.SerializerMethodField()
    isActive     = serializers.BooleanField(source="is_active", required=False)
    createdAt    = serializers.DateTimeField(source="created_at", read_only=True)

    def get_centroLabel(self, obj) -> str:
        return obj.id_centro_atencion.name if obj.id_centro_atencion_id else ""

    def get_tipoLabel(self, obj) -> str:
        return obj.get_tipo_display()

    class Meta:
        model            = Almacen
        fields           = [
            "id", "nombre", "tipo", "tipoLabel",
            "idCentroAtencion", "centroLabel", "descripcion",
            "isActive", "createdAt",
        ]
        read_only_fields = ["id", "centroLabel", "tipoLabel", "createdAt"]
