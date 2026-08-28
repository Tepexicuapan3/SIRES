"""
apps/comunicados/uses_case/actualizar_anuncio_use_case.py
==============================================================
Edición (PATCH) de un anuncio existente.
"""

from apps.comunicados.errors import ComunicadoError
from apps.comunicados.repositories.anuncio_repository import AnuncioRepository


def actualizar_anuncio(anuncio_id, validated_data):
    anuncio = AnuncioRepository.get_by_id(anuncio_id)
    if anuncio is None:
        raise ComunicadoError(
            code="ANUNCIO_NOT_FOUND",
            message="El anuncio no existe",
            status_code=404,
        )

    for field, value in validated_data.items():
        setattr(anuncio, field, value)

    anuncio.save()
    return anuncio
