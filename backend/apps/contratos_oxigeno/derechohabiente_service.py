"""
Búsqueda de derechohabientes (empleados/familiares) en cat_empleados/cat_familiar
para autocompletar el alta de Contratos de Oxígeno.

Solo lee de la base postgres "expedientes" (sermed) — no consulta Oracle.
"""

from datetime import date

from django.db.models import Q

from apps.administracion.models.clinica import CatClinica
from apps.administracion.models.empleado import CatEmpleado
from apps.administracion.models.familiar import CatFamiliar
from .models import ContratoOxigeno


# ── Vigencia ──────────────────────────────────────────────────────────────────

def _estatus_baja(fec_baja, fec_vig) -> str:
    """Reproduce el CASE ACTIVO/BAJA de buscar_expediente.py en Python."""
    if fec_baja is None:
        return "ACTIVO"

    today = date.today()
    if fec_vig is not None:
        dias = min((today - fec_vig).days, (today - fec_baja).days)
    else:
        dias = (today - fec_baja).days

    return "BAJA" if dias > 0 else "ACTIVO"


def _estatus_empleado(emp: CatEmpleado) -> str:
    if emp.cve_cd_laboral in ("J", "P"):
        return "ACTIVO"
    return _estatus_baja(emp.fec_baja, emp.fec_vig)


def _estatus_familiar(fam: CatFamiliar) -> str:
    if fam.fec_vig is not None and fam.fec_vig < date.today():
        return "NO ACTIVO"
    return "ACTIVO"


# ── Tipo derechohabiente ────────────────────────────────────────────────────

def _tp_der_empleado(emp: CatEmpleado) -> str:
    cd_laboral = (emp.cd_laboral or "").strip().upper()
    if cd_laboral in ContratoOxigeno.TpDer.values:
        return cd_laboral
    return "T"


def _tp_der_familiar(fam: CatFamiliar) -> str:
    tp_der = (fam.tp_der or "").strip().upper()
    if tp_der in ContratoOxigeno.TpDer.values:
        return tp_der
    return "F"


def _tp_der_label(tp_der: str) -> str:
    """Devuelve el label de TpDer si el código es uno de los choices del modelo;
    si no (códigos que vienen tal cual de cat_familiar.tp_der), devuelve el código."""
    try:
        return ContratoOxigeno.TpDer(tp_der).label
    except ValueError:
        return tp_der


# ── Helpers ───────────────────────────────────────────────────────────────────

def _nombre_completo(paterno, materno, nombre) -> str:
    return " ".join(p for p in (paterno, materno, nombre) if p).strip()


def _nombres_clinicas(codigos: set[str]) -> dict[str, str]:
    """Mapa cd_clinica -> ds_clinica para los códigos dados."""
    codigos = {c for c in codigos if c}
    if not codigos:
        return {}
    return dict(
        CatClinica.objects.filter(cd_clinica__in=codigos).values_list("cd_clinica", "ds_clinica")
    )


def _q_nombre_o_expediente(q: str, campo_no_exp: str) -> Q:
    """Arma un Q: cada palabra de q debe estar en paterno/materno/nombre (AND entre
    palabras, OR entre campos), o coincidencia exacta de número de expediente."""
    filtro_nombre = Q()
    for token in q.split():
        filtro_nombre &= (
            Q(ds_paterno__icontains=token)
            | Q(ds_materno__icontains=token)
            | Q(ds_nombre__icontains=token)
        )
    return filtro_nombre | Q(**{f"{campo_no_exp}__iexact": q})


# ── Info de vigencia para el listado (batch, evita N+1) ───────────────────────

def info_vigencia_por_expedientes(expedientes: list[str]) -> dict[str, dict]:
    """Mapa expediente -> {vigencia, fechaNacimiento, edad} para los expedientes dados,
    consultando cat_empleados/cat_familiar en lote (una sola query por tabla)."""
    expedientes = [e for e in set(expedientes) if e]
    if not expedientes:
        return {}

    info: dict[str, dict] = {}

    for emp in CatEmpleado.objects.filter(no_exp__in=expedientes):
        info[emp.no_exp] = {
            "vigencia":        _estatus_empleado(emp),
            "fechaNacimiento": emp.fe_nac,
            "edad":            emp.no_edad,
        }

    for fam in CatFamiliar.objects.filter(no_expf__in=expedientes):
        if fam.no_expf not in info:
            info[fam.no_expf] = {
                "vigencia":        _estatus_familiar(fam),
                "fechaNacimiento": fam.fe_nac,
                "edad":            fam.no_edad,
            }

    return info


# ── Búsqueda principal ────────────────────────────────────────────────────────

def buscar_derechohabientes(q: str, clinica: str | None = None, limit: int = 15) -> list[dict]:
    q = (q or "").strip()
    if not q:
        return []

    empleados = CatEmpleado.objects.filter(_q_nombre_o_expediente(q, "no_exp"))
    familiares = CatFamiliar.objects.filter(_q_nombre_o_expediente(q, "no_expf"))

    if clinica:
        empleados  = empleados.filter(cd_clinica=clinica)
        familiares = familiares.filter(cd_clinica=clinica)

    empleados  = list(empleados[:limit])
    familiares = list(familiares[:limit])

    nombres_clinica = _nombres_clinicas(
        {emp.cd_clinica for emp in empleados} | {fam.cd_clinica for fam in familiares}
    )

    resultados: list[dict] = []

    for emp in empleados:
        tp_der = _tp_der_empleado(emp)
        resultados.append({
            "expediente":      emp.no_exp,
            "nombre":          _nombre_completo(emp.ds_paterno, emp.ds_materno, emp.ds_nombre),
            "tpDer":           tp_der,
            "tpDerLabel":      _tp_der_label(tp_der),
            "clinica":         nombres_clinica.get(emp.cd_clinica, emp.cd_clinica),
            "fechaNacimiento": emp.fe_nac,
            "edad":            emp.no_edad,
            "vigencia":        _estatus_empleado(emp),
            "tipo":            "EMPLEADO",
            "pkNum":           None,
        })

    for fam in familiares:
        tp_der = _tp_der_familiar(fam)
        resultados.append({
            "expediente":      fam.no_expf,
            "nombre":          _nombre_completo(fam.ds_paterno, fam.ds_materno, fam.ds_nombre),
            "tpDer":           tp_der,
            "tpDerLabel":      _tp_der_label(tp_der),
            "clinica":         nombres_clinica.get(fam.cd_clinica, fam.cd_clinica),
            "fechaNacimiento": fam.fe_nac,
            "edad":            fam.no_edad,
            "vigencia":        _estatus_familiar(fam),
            "tipo":            "FAMILIAR",
            "pkNum":           fam.pk_num,
        })

    return resultados
