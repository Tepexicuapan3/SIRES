from apps.catalogos.services.cat_cies_service import CatCiesService


class PreviewCiesUseCase:
    """
    Paso 1: Valida el Excel y devuelve las filas con errores.
    NO guarda nada en la BD.
    """

    def execute(self, file, version: str) -> dict:
        service = CatCiesService()
        result = service.process_excel(file, version)
        result["inserted"] = 0
        return result