"""
apps/recepcion/repositories/paciente_repository.py
===================================================
Lectura de expedientes y fotos de credencial.
DB: expedientes (solo lectura). NUNCA escribe aquí.

Reglas:
- pk_num=0 -> trabajador
- pk_num>0 -> derechohabiente
- cat_familiar.no_expf coincide con cat_empleados.no_exp
- se deduplica por pk_num en cat_familiar
"""

import base64
import logging
import zlib
from typing import Optional, TypedDict

from django.core.cache import cache
from django.db.models import Q

from ..models import CatEmpleado, CatFamiliar, DntFotoCredencial, TipoPaciente

logger = logging.getLogger(__name__)

FOTO_CACHE_TTL = 3600  # 1 hora
NO_FOTO_SENTINEL = "__NULL__"


class PacienteDTO(TypedDict):
    tipo: str
    no_exp: int
    pk_num: int
    nombre_completo: str
    cd_sexo: str
    fe_nac: Optional[str]
    vigente: bool
    cd_clinica: Optional[int]
    foto_b64: Optional[str]
    parentesco: Optional[str]


class PacienteRepository:
    # =========================================================================
    # TRABAJADOR
    # =========================================================================

    def get_trabajador(self, no_exp: int) -> Optional[PacienteDTO]:
        try:
            emp = (
                CatEmpleado.objects.using("expedientes")
                .get(no_exp=no_exp)
            )
        except CatEmpleado.DoesNotExist:
            return None

        return self._build_trabajador_dto(emp)

    # =========================================================================
    # PACIENTE ESPECÍFICO (trabajador o derechohabiente)
    # =========================================================================

    def get_paciente(self, no_exp: int, pk_num: int = 0) -> Optional[PacienteDTO]:
        if pk_num == 0:
            return self.get_trabajador(no_exp)

        fam = self._get_familiar_unico(no_exp=no_exp, pk_num=pk_num)
        if not fam:
            return None

        return self._build_familiar_dto(no_exp=no_exp, fam=fam)

    # =========================================================================
    # NÚCLEO FAMILIAR
    # =========================================================================

    def get_nucleo_familiar(self, no_exp: int) -> dict:
        trabajador = self.get_trabajador(no_exp)

        qs = (
            CatFamiliar.objects.using("expedientes")
            .filter(no_expf=no_exp, pk_num__gt=0)
            .order_by("pk_num", "cd_familiar")
        )

        derechohabientes: list[PacienteDTO] = []
        vistos: set[int] = set()

        for fam in qs:
            if fam.pk_num is None:
                continue
            if fam.pk_num in vistos:
                continue

            vistos.add(fam.pk_num)
            derechohabientes.append(
                self._build_familiar_dto(no_exp=no_exp, fam=fam)
            )

        return {
            "trabajador": trabajador,
            "derechohabientes": derechohabientes,
        }

    # =========================================================================
    # BÚSQUEDA / AUTOCOMPLETE
    # =========================================================================

    def buscar_empleados(self, query: str, limit: int = 15) -> list[PacienteDTO]:
        query = (query or "").strip()
        if not query:
            return []

        limit = max(1, min(int(limit), 50))

        qs = CatEmpleado.objects.using("expedientes")

        if query.isdigit():
            qs = qs.filter(no_exp=int(query))
        else:
            words = query.split()
            for w in words:
                qs = qs.filter(
                    Q(ds_paterno__icontains=w)
                    | Q(ds_materno__icontains=w)
                    | Q(ds_nombre__icontains=w)
                )

        resultado: list[PacienteDTO] = []
        for emp in qs.order_by("ds_paterno", "ds_materno", "ds_nombre")[:limit]:
            resultado.append(self._build_trabajador_dto(emp, incluir_foto=False))

        return resultado

    # =========================================================================
    # FOTO
    # =========================================================================

    def _get_foto(self, id_empleado: str, pk_num: int) -> Optional[str]:
        cache_key = f"foto:{id_empleado}:{pk_num}"
        cached = cache.get(cache_key, None)

        if cached is not None:
            return None if cached == NO_FOTO_SENTINEL else cached

        try:
            foto_obj = (
                DntFotoCredencial.objects.using("expedientes")
                .filter(id_empleado=id_empleado, pk_num=pk_num)
                .order_by("-fec_actualizacion", "-fecha_toma", "-id_clave_foto")
                .first()
            )

            if foto_obj and foto_obj.foto:
                raw = bytes(foto_obj.foto)

                # La imagen está almacenada comprimida con zlib en la BD
                try:
                    raw = zlib.decompress(raw)
                except zlib.error:
                    pass  # no estaba comprimida, usar raw directo

                # Detectar tipo de imagen por magic bytes
                if raw[:3] == b'\xff\xd8\xff':
                    mime = "image/jpeg"
                elif raw[:4] == b'\x89PNG':
                    mime = "image/png"
                else:
                    mime = "image/jpeg"

                b64 = f"data:{mime};base64," + base64.b64encode(raw).decode("utf-8")
                cache.set(cache_key, b64, FOTO_CACHE_TTL)
                return b64

        except Exception as exc:
            logger.warning("Error obteniendo foto %s/%s: %s", id_empleado, pk_num, exc)

        cache.set(cache_key, NO_FOTO_SENTINEL, FOTO_CACHE_TTL)
        return None

    # =========================================================================
    # HELPERS
    # =========================================================================

    def _get_familiar_unico(self, no_exp: int, pk_num: int) -> Optional[CatFamiliar]:
        return (
            CatFamiliar.objects.using("expedientes")
            .filter(no_expf=no_exp, pk_num=pk_num)
            .order_by("pk_num", "cd_familiar")
            .first()
        )

    def _build_trabajador_dto(
        self,
        emp: CatEmpleado,
        incluir_foto: bool = True,
    ) -> PacienteDTO:
        return PacienteDTO(
            tipo=TipoPaciente.TRABAJADOR.value,
            no_exp=emp.no_exp,
            pk_num=0,
            nombre_completo=emp.nombre_completo,
            cd_sexo=emp.cd_sexo or "",
            fe_nac=emp.fe_nac.isoformat() if emp.fe_nac else None,
            vigente=emp.vigente,
            cd_clinica=emp.cd_clinica,
            foto_b64=self._get_foto(str(emp.no_exp), pk_num=0) if incluir_foto else None,
            parentesco=None,
        )

    def _build_familiar_dto(
        self,
        no_exp: int,
        fam: CatFamiliar,
        incluir_foto: bool = True,
    ) -> PacienteDTO:
        pk_num = fam.pk_num or 0

        return PacienteDTO(
            tipo=TipoPaciente.DERECHOHABIENTE.value,
            no_exp=no_exp,
            pk_num=pk_num,
            nombre_completo=fam.nombre_completo,
            cd_sexo=fam.cd_sexo or "",
            fe_nac=fam.fe_nac.isoformat() if fam.fe_nac else None,
            vigente=fam.vigente,
            cd_clinica=fam.cd_clinica,
            foto_b64=self._get_foto(str(no_exp), pk_num=pk_num) if incluir_foto else None,
            parentesco=fam.cd_parentesco or None,
        )
