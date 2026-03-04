from apps.catalogos.services.cat_cies_service import CatCiesService


class ConfirmCiesUseCase:
    """
    Paso 2: Recibe las filas ya validadas desde el frontend
    y guarda solo las que no tienen error.
    """

    def execute(self, rows: list, user_id: int) -> dict:
        service = CatCiesService()
        inserted = service.save_valid_rows(rows, user_id)

        return {
            "total_records": len(rows),
            "total_errores": sum(
                1 for r in rows if r.get("ERROR", "").strip() != ""
            ),
            "inserted": inserted,
        }