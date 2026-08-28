"""
apps/comunicados/models.py
=============================
Modelo de datos del módulo Comunicados (Fase 1: solo `Anuncio`, el flyer
que el personal administrativo de SISEM publica y que se muestra como
banner en el portal de citas).

``managed=True`` (a diferencia de los catálogos replicados desde Oracle):
Django crea y administra la tabla ``com_anuncios``.

``creado_por_id`` es ``BigIntegerField`` plano, NO ``ForeignKey`` -- el
usuario vive en la BD "default" vía ``apps.authentication.SyUsuario`` pero
este patrón (campo plano poblado con el id del actor, sin FK real) es el
mismo que usa todo el resto del codebase para auditoría de quién creó un
registro (ver ``catalogos/models/base.py:CatalogBase`` y
``farmacia/models.py``), así que se sigue aquí por consistencia, aunque en
este caso sí seria posible una FK real (misma BD).

``eliminado_en``: NO estaba en la tabla de campos del design doc original
del change `anuncios-portal-citas`, pero el spec (`sdd/anuncios-portal-citas/spec`,
dominio `comunicados/anuncios-crud`) exige borrado lógico explícito ("El
borrado SHALL ser lógico: marca `eliminado_en`, no borra fila ni
archivo"), con escenarios de aceptación que dependen de este campo. Se
agrega acá para cerrar esa brecha entre design y spec, siguiendo el
nombre exacto que usan los escenarios del spec.
"""

from django.db import models

from apps.comunicados.storage import adjunto_upload_to, anuncio_upload_to


class Anuncio(models.Model):
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, default="")

    imagen = models.ImageField(upload_to=anuncio_upload_to, max_length=255)
    adjunto_pdf = models.FileField(
        upload_to=adjunto_upload_to, max_length=255, null=True, blank=True
    )
    enlace_url = models.URLField(max_length=500, blank=True, default="")

    vigencia_desde = models.DateField()
    vigencia_hasta = models.DateField(null=True, blank=True)

    activo = models.BooleanField(default=True)
    orden = models.PositiveSmallIntegerField(default=0)

    creado_por_id = models.BigIntegerField(db_column="usr_alta", null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    # Borrado lógico (spec `comunicados/anuncios-crud`, requerimiento
    # "Edición y borrado lógico"): nulo = vigente, con valor = borrado.
    eliminado_en = models.DateTimeField(null=True, blank=True, default=None)

    class Meta:
        db_table = "com_anuncios"
        ordering = ["orden", "-vigencia_desde"]
        indexes = [
            models.Index(
                fields=["activo", "vigencia_desde", "vigencia_hasta"],
                name="com_anuncio_vigencia_idx",
            ),
            models.Index(
                fields=["activo", "orden"],
                name="com_anuncio_activo_orden_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(vigencia_hasta__isnull=True)
                | models.Q(vigencia_hasta__gte=models.F("vigencia_desde")),
                name="com_anuncio_vigencia_coherente",
            ),
        ]

    def __str__(self):
        return self.titulo
