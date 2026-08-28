"""
apps/comunicados/uses_case/listar_anuncios_vigentes_use_case.py
====================================================================
Lectura de anuncios vigentes para el banner del portal de citas
(consumido por `AnunciosPortalView` en `apps.portal_citas.views`).
"""

from apps.comunicados.repositories.anuncio_repository import AnuncioRepository


class ListarAnunciosVigentesUseCase:
    @staticmethod
    def execute(hoy=None):
        return AnuncioRepository.list_vigentes(hoy=hoy)
