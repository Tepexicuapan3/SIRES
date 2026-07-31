"""
apps/portal_citas/services/nucleo_service.py
================================================
Resuelve el "núcleo" de pacientes que una sesión de portal autenticada
puede ver y gestionar (Fase 3).

Regla de autorización (decisión de negocio confirmada explícitamente por
el usuario — no modificar sin validar de nuevo):

- Titular (``PortalMiembro.es_titular_login=True``, ``pk_num=0``): ve y
  puede gestionar a TODO el núcleo — él mismo + TODOS los derechohabientes
  (``CatFamiliar``) del mismo ``no_exp``, sean adultos o menores.
- Derechohabiente adulto logueado por su cuenta (``es_titular_login=False``):
  ve y puede gestionar solo a sí mismo + los MENORES del mismo ``no_exp``
  (edad calculada en tiempo real desde ``fe_nac``, mismo criterio que
  ``identity_service.IdentidadResuelta.es_menor_de_edad`` — nunca se usa
  ``no_edad`` cacheado). No ve a otros adultos del núcleo (ni al titular,
  ni a otro derechohabiente adulto).

El titular (``pk_num=0``) se representa con datos de ``CatEmpleado``
(no tiene fila propia en ``CatFamiliar``); el resto viene de
``CatFamiliar.objects.filter(no_expf=no_exp)``.

Por cada persona visible (salvo la propia sesión, que ya tiene su
``PortalMiembro``) se hace ``get_or_create`` para asignarle/reusar su
``id`` opaco estable — necesario porque un menor nunca inicia sesión por
su cuenta, pero igual necesita un id estable para ser elegido como
paciente destino de una cita en fases posteriores.

IMPORTANTE: nunca se tocan ``correo``/``correo_verificado`` (ni ningún
otro campo) de un ``PortalMiembro`` ya existente que no sea el de la
sesión actual — esos campos son exclusivos de cuando esa persona se
loguea por sí misma (ver ``iniciar_sesion_usecase``/``verificar_codigo_usecase``).
``get_or_create`` solo aplica ``defaults`` en creación, nunca sobre un
registro ya existente, así que esto se cumple por construcción.
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional

from apps.administracion.models.familiar import CatFamiliar
from apps.administracion.services.fecha_service import calcular_edad
from apps.portal_citas.models import PortalMiembro
from apps.portal_citas.services.identity_service import EDAD_MINIMA_LOGIN


def _armar_nombre(ds_nombre, ds_paterno, ds_materno) -> str:
    partes = [ds_nombre or "", ds_paterno or "", ds_materno or ""]
    return " ".join(p for p in partes if p).strip()


def _es_menor(fe_nac: Optional[date]) -> bool:
    # Mismo criterio que identity_service: sin fecha válida se trata como
    # menor por seguridad (no se asume mayoría de edad sin dato).
    edad = calcular_edad(fe_nac)
    return edad is None or edad < EDAD_MINIMA_LOGIN


@dataclass
class _FamiliarNucleo:
    pk_num: int
    nombre: str
    fe_nac: Optional[date]


def _familiares_del_nucleo(no_exp: str) -> list[_FamiliarNucleo]:
    return [
        _FamiliarNucleo(
            pk_num=f.pk_num,
            nombre=_armar_nombre(f.ds_nombre, f.ds_paterno, f.ds_materno),
            fe_nac=f.fe_nac,
        )
        for f in CatFamiliar.objects.filter(no_expf=no_exp)
    ]


def _es_visible(miembro_sesion: PortalMiembro, familiar: _FamiliarNucleo) -> bool:
    """
    Regla de autorización (única fuente de verdad, ver docstring del
    módulo): titular ve todo el núcleo; derechohabiente adulto solo se ve a
    sí mismo + menores. Compartida por ``obtener_nucleo`` y
    ``_pk_nums_gestionables`` (esta última usada por Fase 8, listado de
    citas del portal) para no duplicar la regla de negocio en dos lugares.
    """
    if miembro_sesion.es_titular_login:
        return True
    return _es_menor(familiar.fe_nac)


def _pk_nums_gestionables(miembro_sesion: PortalMiembro) -> list[int]:
    """
    ``pk_num`` (todos dentro del mismo ``no_exp`` de la sesión — por eso
    alcanza con esta lista y no hace falta armar pares ``(no_exp, pk_num)``)
    que la sesión actual puede ver/gestionar, incluyéndose a sí misma.

    Usada por Fase 8 (``GET /portal/citas``, listado de citas del núcleo)
    para filtrar ``CitaMedica`` sin reimplementar la regla de autorización
    de ``obtener_nucleo``.
    """
    pk_nums = [miembro_sesion.pk_num]
    for familiar in _familiares_del_nucleo(miembro_sesion.no_exp):
        if familiar.pk_num == miembro_sesion.pk_num:
            continue
        if _es_visible(miembro_sesion, familiar):
            pk_nums.append(familiar.pk_num)
    return pk_nums


def obtener_nucleo(miembro_sesion: PortalMiembro) -> list[dict]:
    """
    Devuelve ``[{miembroId, nombreVisible, esMenor}, ...]`` — nunca
    ``no_exp``/``pk_num``/fecha de nacimiento completa.
    """
    no_exp = miembro_sesion.no_exp

    # La propia sesión siempre está incluida y ya tiene su PortalMiembro
    # (creado en el login, Fase 2) — no se re-crea ni se toca.
    resultado = [{
        "miembroId": str(miembro_sesion.id),
        "nombreVisible": miembro_sesion.nombre_visible,
        # Quien inicia sesión por su cuenta nunca es menor (identity_service
        # ya rechaza el login de un menor con MENOR_DE_EDAD).
        "esMenor": False,
    }]

    for familiar in _familiares_del_nucleo(no_exp):
        if familiar.pk_num == miembro_sesion.pk_num:
            continue  # ya representado arriba por miembro_sesion

        if not _es_visible(miembro_sesion, familiar):
            # Derechohabiente no-titular: no ve a otros adultos del núcleo.
            continue

        es_menor = _es_menor(familiar.fe_nac)

        portal_miembro, _creado = PortalMiembro.objects.get_or_create(
            no_exp=no_exp,
            pk_num=familiar.pk_num,
            defaults={
                "nombre_visible": familiar.nombre,
                "es_titular_login": False,  # un CatFamiliar nunca es el titular.
            },
        )
        resultado.append({
            "miembroId": str(portal_miembro.id),
            "nombreVisible": portal_miembro.nombre_visible,
            "esMenor": es_menor,
        })

    return resultado


def puede_gestionar_miembro(miembro_sesion: PortalMiembro, miembro_objetivo_id) -> bool:
    """
    True si ``miembro_objetivo_id`` (``PortalMiembro.id``, UUID o str) está
    entre los miembros que ``miembro_sesion`` puede ver/gestionar.

    Reusa ``obtener_nucleo`` en vez de reimplementar la regla de
    autorización (titular ve todo el núcleo; derechohabiente adulto ve solo
    a sí mismo + menores) — necesaria en Fase 4 para validar a nombre de
    quién se puede reservar una cita. Single source of truth: si la regla
    de negocio cambia, solo se toca ``obtener_nucleo``.
    """
    objetivo_id = str(miembro_objetivo_id)
    return any(m["miembroId"] == objetivo_id for m in obtener_nucleo(miembro_sesion))
