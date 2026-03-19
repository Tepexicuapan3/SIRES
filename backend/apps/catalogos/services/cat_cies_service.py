import re

import pandas as pd
from django.db import transaction

#from apps.catalogos.models import CatCies
from apps.catalogos.repositories.cat_cies_repository import CatCiesRepository


class CatCiesService:

    def __init__(self):
        self.repository = CatCiesRepository()

    def process_excel(self, file, version: str, ) -> dict:
        """
        Lee el Excel, valida las filas y devuelve el resultado
        con errores por fila. NO guarda nada en base de datos.
        """
        df = pd.read_excel(file, usecols=[0, 1])
        df.columns = ["CLAVE", "DESCRIPCION"]

        # Limpieza
        df["CLAVE"] = (
            df["CLAVE"]
            .astype(str)
            .str.strip()
            .apply(lambda x: re.sub(r"\s+", " ", str(x)))
        )
        df["DESCRIPCION"] = (
            df["DESCRIPCION"]
            .astype(str)
            .str.strip()
            .apply(lambda x: re.sub(r"\s+", " ", str(x)))
        )

        df["VERSION"] = version
        df["ERROR"] = ""

        # ── Validaciones ──────────────────────────────────────
        df.loc[df["CLAVE"] == "", "ERROR"] += "Clave vacía. "
        df.loc[df["CLAVE"].str.len() > 8, "ERROR"] += "Clave demasiado larga. Máximo 8 caracteres. "

        dup_clave = df[df["CLAVE"] != ""].duplicated(subset=["CLAVE"], keep=False)
        df.loc[dup_clave, "ERROR"] += "Clave duplicada. "

        df.loc[df["DESCRIPCION"] == "", "ERROR"] += "Descripción vacía. "
        df.loc[df["DESCRIPCION"].str.len() > 400, "ERROR"] += "Descripción demasiado larga. Máximo 400 caracteres. "

        dup_desc = df[df["DESCRIPCION"] != ""].duplicated(subset=["DESCRIPCION"], keep=False)
        df.loc[dup_desc, "ERROR"] += "Descripción duplicada. "
        # ──────────────────────────────────────────────────────

        total_errores = int((df["ERROR"] != "").sum())

        return {
            "total_records": len(df),
            "total_errores": total_errores,
            "rows": df.to_dict(orient="records"),
        }

    @transaction.atomic
    def save_valid_rows(self, rows: list, user_id: int) -> int:
        valid_rows = [
            r for r in rows
            if r.get("ERROR", "").strip() == ""
        ]

        if not valid_rows:
            return 0

        return self.repository.bulk_upsert(valid_rows, user_id)