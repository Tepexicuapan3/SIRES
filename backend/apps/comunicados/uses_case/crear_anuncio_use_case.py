"""
apps/comunicados/uses_case/crear_anuncio_use_case.py
========================================================
Alta de un anuncio. Requiere ``imagen`` (validada por
``AnuncioWriteSerializer``); el resto de las reglas de negocio (actor que
crea) se resuelven acá, no en la vista.
"""

from apps.comunicados.models import Anuncio


def crear_anuncio(validated_data, actor_id):
    return Anuncio.objects.create(creado_por_id=actor_id, **validated_data)
