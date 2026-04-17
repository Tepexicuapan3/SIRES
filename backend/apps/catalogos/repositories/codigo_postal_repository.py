import csv
import logging
from functools import cached_property
from pathlib import Path
from typing import TypedDict

from django.conf import settings

logger = logging.getLogger(__name__)


class ColoniaInfo(TypedDict):
    codigo_postal:     str
    colonia:           str
    tipo_asentamiento: str
    municipio:         str
    estado:            str
    ciudad:            str
    zona:              str


# Mapeo fijo: columna CSV → clave del dict de salida
_COLUMN_MAP: dict[str, str] = {
    "d_codigo":      "codigo_postal",
    "d_asenta":      "colonia",
    "d_tipo_asenta": "tipo_asentamiento",
    "D_mnpio":       "municipio",
    "d_estado":      "estado",
    "d_ciudad":      "ciudad",
    "d_zona":        "zona",
}

_KNOWN_DELIMITERS = ("|", "\t", ",")


class CodigoPostalRepository:
    """
    Lee el archivo de códigos postales una sola vez y construye
    un índice en memoria para búsquedas O(1).
    """

    FILE_SETTING = "CODIGOS_POSTALES_PATH"   # settings.CODIGOS_POSTALES_PATH
    FILE_FALLBACK = "codigos_postales.txt"   # si el setting no existe

    @cached_property
    def _index(self) -> dict[str, list[ColoniaInfo]]:
        """Carga y construye el índice CP → [colonias] una sola vez."""
        file_path = self._resolve_path()

        if not file_path.exists():
            logger.warning("Archivo de códigos postales no encontrado: %s", file_path)
            return {}

        index: dict[str, list[ColoniaInfo]] = {}
        delimiter = self._detect_delimiter(file_path)

        with open(file_path, encoding="cp1252") as fh:
            reader = csv.DictReader(fh, delimiter=delimiter)
            for row in reader:
                entry = self._parse_row(row)
                cp = entry["codigo_postal"]
                if cp:
                    index.setdefault(cp, []).append(entry)

        logger.info("Índice CP cargado: %d códigos postales únicos.", len(index))
        return index

    def search_by_cp(self, cp: str) -> list[ColoniaInfo]:
        return self._index.get(cp.strip(), [])

    # ------------------------------------------------------------------ #
    # Helpers privados                                                     #
    # ------------------------------------------------------------------ #

    def _resolve_path(self) -> Path:
        path = getattr(settings, self.FILE_SETTING, None)
        if path:
            return Path(path)
        return Path(__file__).resolve().parent.parent / self.FILE_FALLBACK

    @staticmethod
    def _detect_delimiter(file_path: Path, sample_size: int = 4096) -> str:
        with open(file_path, encoding="cp1252") as fh:
            sample = fh.read(sample_size)
        for delimiter in _KNOWN_DELIMITERS:
            if delimiter in sample:
                return delimiter
        return "|"  # fallback

    @staticmethod
    def _parse_row(row: dict) -> ColoniaInfo:
        return {
            out_key: (row.get(csv_col) or "").strip()
            for csv_col, out_key in _COLUMN_MAP.items()
        }