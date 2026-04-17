import re

from ..repositories.codigo_postal_repository import CodigoPostalRepository, ColoniaInfo

_cp_repository = CodigoPostalRepository()  # instancia compartida → caché activo

_CP_REGEX = re.compile(r"^\d{5}$")


class CodigoPostalService:

    @staticmethod
    def search(cp: str) -> list[ColoniaInfo]:
        cp = (cp or "").strip()

        if not _CP_REGEX.match(cp):
            return []

        return _cp_repository.search_by_cp(cp)