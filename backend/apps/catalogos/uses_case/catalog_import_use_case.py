from typing import Optional

from apps.catalogos.imports.registry import CatalogImportSpec
from apps.catalogos.repositories.catalog_import_repository import CatalogImportRepository
from apps.catalogos.services.catalog_import_service import build_template, parse_and_validate


class TemplateUseCase:
    def execute(self, spec: CatalogImportSpec) -> bytes:
        return build_template(spec)


class PreviewCatalogImportUseCase:
    """Paso 1: valida el Excel y devuelve las filas con error. NO escribe en la BD."""

    def execute(self, spec: CatalogImportSpec, file) -> dict:
        result = parse_and_validate(spec, file)
        return {
            "total_records": result["total_records"],
            "total_errores": result["total_errores"],
            "inserted": 0,
            "rows": result["rows"],
        }


class ConfirmCatalogImportUseCase:
    """
    Paso 2: recibe el MISMO archivo (nunca filas del cliente) y re-corre parse_and_validate
    como única autoridad. Todo-o-nada: si queda un solo error, no se llama al repositorio.
    """

    def __init__(self, repository: Optional[CatalogImportRepository] = None):
        self.repository = repository or CatalogImportRepository()

    def execute(self, spec: CatalogImportSpec, file, user_id: int) -> dict:
        result = parse_and_validate(spec, file)

        if result["total_errores"] > 0:
            return {
                "total_records": result["total_records"],
                "total_errores": result["total_errores"],
                "inserted": 0,
                "rows": result["rows"],
                "has_errors": True,
            }

        inserted = self.repository.bulk_insert(spec, result["records"], user_id)
        return {
            "total_records": result["total_records"],
            "total_errores": 0,
            "inserted": inserted,
            "rows": result["rows"],
            "has_errors": False,
        }
