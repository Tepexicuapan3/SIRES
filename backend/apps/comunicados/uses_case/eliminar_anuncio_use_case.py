"""
apps/comunicados/uses_case/eliminar_anuncio_use_case.py
============================================================
Borrado lógico de un anuncio (spec `comunicados/anuncios-crud`: marca
``eliminado_en``, NO borra la fila ni el archivo -- preserva auditoría y
no rompe archivos ya distribuidos/cacheados).
"""

from django.utils import timezone

from apps.comunicados.errors import ComunicadoError
from apps.comunicados.repositories.anuncio_repository import AnuncioRepository


def eliminar_anuncio(anuncio_id):
    anuncio = AnuncioRepository.get_by_id(anuncio_id)
    if anuncio is None:
        raise ComunicadoError(
            code="ANUNCIO_NOT_FOUND",
            message="El anuncio no existe",
            status_code=404,
        )

    anuncio.eliminado_en = timezone.now()
    anuncio.save(update_fields=["eliminado_en"])
    return anuncio
