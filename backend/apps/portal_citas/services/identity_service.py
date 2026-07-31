"""
apps/portal_citas/services/identity_service.py
==================================================
Resuelve la identidad de un miembro del portal (titular o derechohabiente)
usando SOLO datos que la persona conoce de memoria: ``no_exp`` + nombre
completo + fecha de nacimiento. ``pk_num`` es un dato interno de
programación — nunca se le pide ni se le muestra al usuario; se resuelve
puertas adentro consultando los catálogos replicados desde Oracle
(``CatEmpleado`` / ``CatFamiliar``, BD ``expedientes``, vía
``routers.ExpedientesRouter``), normalizando el nombre (sin acentos,
mayúsculas) para la comparación.

``pk_num=0`` implícito para el titular (viene de ``CatEmpleado``),
``pk_num>0`` para derechohabientes (viene de ``CatFamiliar``, enlazado por
convención ``no_expf == no_exp``).
"""

import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from datetime import date
from typing import Optional

from apps.administracion.models.empleado import CatEmpleado
from apps.administracion.models.familiar import CatFamiliar
from apps.administracion.services.fecha_service import calcular_edad

# Regla de edad: un menor no puede iniciar sesión por su cuenta.
EDAD_MINIMA_LOGIN = 18


@dataclass
class IdentidadResuelta:
    no_exp: str
    pk_num: int
    nombre_visible: str
    fe_nac: Optional[date]
    es_titular: bool

    @property
    def edad(self) -> Optional[int]:
        # Se calcula en tiempo real desde fe_nac; no se confía en no_edad
        # cacheado del catálogo.
        return calcular_edad(self.fe_nac)

    @property
    def es_menor_de_edad(self) -> bool:
        edad = self.edad
        # Sin fecha de nacimiento válida no podemos garantizar mayoría de
        # edad: se trata como menor por seguridad.
        return edad is None or edad < EDAD_MINIMA_LOGIN


def _normalizar_nombre(texto: str) -> str:
    # Quita acentos, pasa a mayúsculas, colapsa espacios y descarta
    # cualquier caracter que no sea letra (puntuación, dígitos, etc).
    if not texto:
        return ""
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    texto = texto.upper()
    texto = re.sub(r"[^A-Z\s]", " ", texto)
    return " ".join(texto.split())


def _nombres_coinciden(nombre_catalogo: str, nombre_ingresado: str) -> bool:
    # Compara por conjunto (multiset) de palabras normalizadas, no por
    # cadena exacta: tolera que la persona escriba el nombre en otro orden
    # (ej. "Paterno Materno Nombre" vs "Nombre Paterno Materno"), pero exige
    # que todas las palabras estén presentes (ni de más ni de menos).
    tokens_catalogo = _normalizar_nombre(nombre_catalogo).split()
    tokens_ingresado = _normalizar_nombre(nombre_ingresado).split()
    if not tokens_catalogo or not tokens_ingresado:
        return False
    return Counter(tokens_catalogo) == Counter(tokens_ingresado)


def _armar_nombre(ds_nombre, ds_paterno, ds_materno) -> str:
    partes = [ds_nombre or "", ds_paterno or "", ds_materno or ""]
    return " ".join(p for p in partes if p).strip()


def resolve_identity(
    no_exp: str, nombre_completo: str, fecha_nacimiento: date
) -> Optional[IdentidadResuelta]:
    """
    Intenta resolver la identidad contra ``CatEmpleado`` (titular, pk_num=0)
    y, si no matchea, contra ``CatFamiliar`` (derechohabientes, pk_num>0)
    que comparten el mismo ``no_exp`` (``no_expf``).

    Devuelve ``None`` si ningún registro matchea los tres datos a la vez
    — sin distinguir cuál dato falló, para no darle pistas a un atacante.
    """
    if not no_exp or not nombre_completo or not fecha_nacimiento:
        return None

    empleado = CatEmpleado.objects.filter(no_exp=no_exp).first()
    if empleado:
        nombre_catalogo = _armar_nombre(
            empleado.ds_nombre, empleado.ds_paterno, empleado.ds_materno
        )
        if (
            _nombres_coinciden(nombre_catalogo, nombre_completo)
            and empleado.fe_nac
            and empleado.fe_nac == fecha_nacimiento
        ):
            return IdentidadResuelta(
                no_exp=empleado.no_exp,
                pk_num=0,
                nombre_visible=nombre_catalogo,
                fe_nac=empleado.fe_nac,
                es_titular=True,
            )

    familiares = CatFamiliar.objects.filter(no_expf=no_exp)
    for familiar in familiares:
        nombre_catalogo = _armar_nombre(
            familiar.ds_nombre, familiar.ds_paterno, familiar.ds_materno
        )
        if (
            _nombres_coinciden(nombre_catalogo, nombre_completo)
            and familiar.fe_nac
            and familiar.fe_nac == fecha_nacimiento
        ):
            return IdentidadResuelta(
                no_exp=no_exp,
                pk_num=familiar.pk_num,
                nombre_visible=nombre_catalogo,
                fe_nac=familiar.fe_nac,
                es_titular=False,
            )

    return None
