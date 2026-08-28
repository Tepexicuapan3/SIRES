"""
apps/comunicados/repositories/anuncio_repository.py
=======================================================
Única capa que toca el ORM para ``Anuncio``. Los use cases y las vistas no
arman querysets directamente.
"""

from django.db.models import Q
from django.utils import timezone

from apps.comunicados.models import Anuncio

# Límite de anuncios simultáneos en el banner del portal (decisión 11 del
# índice `architecture/anuncios-portal-citas`: máximo 3-5 vigentes a la
# vez, para evitar spam visual). No estaba reflejado ni en spec ni en
# design -- se cierra acá con el valor superior del rango acordado.
MAX_ANUNCIOS_VIGENTES = 5


class AnuncioRepository:
    @staticmethod
    def list_admin(filtros=None):
        """
        Listado para el CRUD de SISEM: excluye borrados lógicos, sin
        filtro de vigencia (el admin ve programados/expirados también).
        """
        qs = Anuncio.objects.filter(eliminado_en__isnull=True)

        filtros = filtros or {}
        activo = filtros.get("activo")
        if activo is not None:
            qs = qs.filter(activo=activo)

        return qs

    @staticmethod
    def list_vigentes(hoy=None):
        """
        Anuncios visibles en el banner del portal hoy: no borrados,
        activos, y dentro del rango de vigencia (nulos = indefinido).
        Ordenados por ``orden`` asc y, en empate, por ``creado_en`` desc
        (spec `sdd/anuncios-portal-citas/spec`, dominio
        `comunicados/anuncios-portal-read`). Recortado a
        ``MAX_ANUNCIOS_VIGENTES`` (decisión 11).
        """
        hoy = hoy or timezone.localdate()

        vigente_desde = Q(vigencia_desde__isnull=True) | Q(vigencia_desde__lte=hoy)
        vigente_hasta = Q(vigencia_hasta__isnull=True) | Q(vigencia_hasta__gte=hoy)

        qs = (
            Anuncio.objects.filter(eliminado_en__isnull=True, activo=True)
            .filter(vigente_desde)
            .filter(vigente_hasta)
            .order_by("orden", "-creado_en")
        )

        return list(qs[:MAX_ANUNCIOS_VIGENTES])

    @staticmethod
    def get_by_id(anuncio_id):
        return Anuncio.objects.filter(id=anuncio_id, eliminado_en__isnull=True).first()
