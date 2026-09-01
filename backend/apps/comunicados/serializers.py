"""
apps/comunicados/serializers.py
==================================
Serializers del módulo Comunicados. Las validaciones de archivo (formato
y tamaño) viven en ``AnuncioWriteSerializer`` -- ver spec
`sdd/anuncios-portal-citas/spec`, dominio `comunicados/media-validation`:
imagen JPG/PNG/WEBP <= 3MB (subido desde 1MB, ver decisión en engram
`sdd/anuncios-portal-citas/spec`), adjunto PDF <= 5MB opcional.

Contrato de campos: camelCase en el wire, ``source=`` hacia los campos
snake_case del modelo -- misma convención que ``apps.catalogos.serializers``
(ver p.ej. ``isActive = BooleanField(source="is_active")``) y ya seguida acá
mismo por ``AnuncioPortalSerializer``. No hay capa de conversión
camelCase<->snake_case en el proyecto: el naming lo pone el serializer.
"""

import os

from rest_framework import serializers

from apps.comunicados.models import Anuncio

IMAGE_MAX_BYTES = 3 * 1024 * 1024  # 3 MB
PDF_MAX_BYTES = 5 * 1024 * 1024  # 5 MB

_ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
_ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class AnuncioListSerializer(serializers.ModelSerializer):
    imagenUrl = serializers.SerializerMethodField()
    vigenciaDesde = serializers.DateField(source="vigencia_desde")
    vigenciaHasta = serializers.DateField(source="vigencia_hasta")
    creadoEn = serializers.DateTimeField(source="creado_en")

    class Meta:
        model = Anuncio
        fields = [
            "id",
            "titulo",
            "imagenUrl",
            "vigenciaDesde",
            "vigenciaHasta",
            "activo",
            "orden",
            "creadoEn",
        ]

    def get_imagenUrl(self, obj):
        return obj.imagen.url if obj.imagen else None


class AnuncioDetailSerializer(serializers.ModelSerializer):
    imagenUrl = serializers.SerializerMethodField()
    adjuntoUrl = serializers.SerializerMethodField()
    enlaceUrl = serializers.CharField(source="enlace_url")
    vigenciaDesde = serializers.DateField(source="vigencia_desde")
    vigenciaHasta = serializers.DateField(source="vigencia_hasta")
    creadoPorId = serializers.IntegerField(source="creado_por_id", allow_null=True)
    creadoEn = serializers.DateTimeField(source="creado_en")
    actualizadoEn = serializers.DateTimeField(source="actualizado_en")

    class Meta:
        model = Anuncio
        fields = [
            "id",
            "titulo",
            "descripcion",
            "imagenUrl",
            "adjuntoUrl",
            "enlaceUrl",
            "vigenciaDesde",
            "vigenciaHasta",
            "activo",
            "orden",
            "creadoPorId",
            "creadoEn",
            "actualizadoEn",
        ]

    def get_imagenUrl(self, obj):
        return obj.imagen.url if obj.imagen else None

    def get_adjuntoUrl(self, obj):
        return obj.adjunto_pdf.url if obj.adjunto_pdf else None


class AnuncioWriteSerializer(serializers.ModelSerializer):
    enlaceUrl = serializers.URLField(
        source="enlace_url", required=False, allow_blank=True
    )
    vigenciaDesde = serializers.DateField(source="vigencia_desde")
    vigenciaHasta = serializers.DateField(
        source="vigencia_hasta", required=False, allow_null=True
    )
    adjuntoPdf = serializers.FileField(
        source="adjunto_pdf", required=False, allow_null=True
    )

    class Meta:
        model = Anuncio
        fields = [
            "titulo",
            "descripcion",
            "imagen",
            "adjuntoPdf",
            "enlaceUrl",
            "vigenciaDesde",
            "vigenciaHasta",
            "activo",
            "orden",
        ]

    def validate_imagen(self, value):
        if value in (None, ""):
            return value

        extension = self._extension(value.name)
        content_type = getattr(value, "content_type", None)

        if extension not in _ALLOWED_IMAGE_EXTENSIONS or (
            content_type is not None and content_type not in _ALLOWED_IMAGE_CONTENT_TYPES
        ):
            raise serializers.ValidationError(
                "Formato de imagen no permitido. Usa JPG, PNG o WEBP.",
                code="invalid_image_format",
            )

        if value.size > IMAGE_MAX_BYTES:
            raise serializers.ValidationError(
                "La imagen excede el tamaño máximo permitido (3 MB).",
                code="image_too_large",
            )

        return value

    def validate_adjuntoPdf(self, value):
        if value in (None, ""):
            return value

        extension = self._extension(value.name)
        content_type = getattr(value, "content_type", None)

        if extension != ".pdf" or (
            content_type is not None and content_type != "application/pdf"
        ):
            raise serializers.ValidationError(
                "El adjunto debe ser un archivo PDF.",
                code="invalid_attachment",
            )

        if value.size > PDF_MAX_BYTES:
            raise serializers.ValidationError(
                "El adjunto excede el tamaño máximo permitido (5 MB).",
                code="invalid_attachment",
            )

        return value

    def validate(self, attrs):
        vigencia_desde = attrs.get(
            "vigencia_desde", getattr(self.instance, "vigencia_desde", None)
        )
        vigencia_hasta = attrs.get(
            "vigencia_hasta", getattr(self.instance, "vigencia_hasta", None)
        )

        if vigencia_desde and vigencia_hasta and vigencia_hasta < vigencia_desde:
            raise serializers.ValidationError(
                {"vigenciaHasta": ["Debe ser posterior o igual a vigenciaDesde."]},
                code="invalid_date_range",
            )

        return attrs

    @staticmethod
    def _extension(filename):
        return (os.path.splitext(filename or "")[1] or "").lower()


class AnuncioPortalSerializer(serializers.ModelSerializer):
    imagenUrl = serializers.SerializerMethodField()
    adjuntoUrl = serializers.SerializerMethodField()
    enlaceUrl = serializers.CharField(source="enlace_url")

    class Meta:
        model = Anuncio
        fields = ["id", "titulo", "descripcion", "imagenUrl", "adjuntoUrl", "enlaceUrl", "orden"]

    def get_imagenUrl(self, obj):
        return obj.imagen.url if obj.imagen else None

    def get_adjuntoUrl(self, obj):
        return obj.adjunto_pdf.url if obj.adjunto_pdf else None
