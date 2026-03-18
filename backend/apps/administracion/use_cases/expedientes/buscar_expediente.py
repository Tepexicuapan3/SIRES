"""
Caso de uso: Buscar expediente.

Consulta PostgreSQL para obtener datos del empleado y sus familiares,
incluyendo fotos, estatus y edad calculada.
Equivale a la vista ``expedientes`` del módulo Flask original.
"""

import logging
from datetime import date

from django.db import connections

#connection = connections['expedientes']

from ...services.imagen_service import optimizar_imagen
from ...services.fecha_service import calcular_edad

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# SQL (adaptado de MySQL → PostgreSQL)
# ──────────────────────────────────────────────────────────────

SQL_EMPLEADO = """
    SELECT
        e.no_exp,
        e.ds_paterno,
        e.ds_materno,
        e.ds_nombre,
        e.cd_laboral,
        e.cve_cd_laboral,
        e.fec_baja,
        e.fe_nac,
        e.fec_vig,
        e.cve_baja,
        'TRABAJADOR' AS parentesco,
        c.ds_clinica AS clinica,
        CASE
            WHEN e.cve_cd_laboral = '16' THEN
                CASE
                    WHEN e.fec_baja IS NULL THEN 'ACTIVO'
                    WHEN 0 <
                        CASE
                            WHEN e.fec_vig IS NOT NULL AND e.fec_baja IS NOT NULL THEN
                                LEAST(
                                    CURRENT_DATE - e.fec_vig,
                                    CURRENT_DATE - e.fec_baja
                                )
                            WHEN e.fec_vig IS NOT NULL THEN
                                CURRENT_DATE - e.fec_vig
                            ELSE
                                CURRENT_DATE - e.fec_baja
                        END
                    THEN 'BAJA'
                    ELSE 'ACTIVO'
                END
            WHEN e.cve_cd_laboral IN ('J', 'P') THEN 'ACTIVO'
            ELSE
                CASE
                    WHEN e.fec_baja IS NULL THEN 'ACTIVO'
                    WHEN 0 <
                        CASE
                            WHEN e.fec_vig IS NOT NULL AND e.fec_baja IS NOT NULL THEN
                                LEAST(
                                    CURRENT_DATE - e.fec_vig,
                                    CURRENT_DATE - e.fec_baja
                                )
                            WHEN e.fec_vig IS NOT NULL THEN
                                CURRENT_DATE - e.fec_vig
                            ELSE
                                CURRENT_DATE - e.fec_baja
                        END
                    THEN 'BAJA'
                    ELSE 'ACTIVO'
                END
        END AS estatus
    FROM cat_empleados e
    LEFT JOIN cat_clinicas c ON e.cd_clinica = c.cd_clinica
    WHERE e.no_exp = %s
"""

SQL_FAMILIAR = """
    SELECT
        f.no_expf,
        f.ds_paterno,
        f.ds_materno,
        f.ds_nombre,
        f.cd_parentesco,
        f.fe_nac,
        f.fec_vig,
        f.pk_num,
        c.ds_clinica AS clinica,
        CASE
            WHEN f.fec_vig < CURRENT_DATE THEN 'NO ACTIVO'
            ELSE 'ACTIVO'
        END AS estatus
    FROM cat_familiar f
    LEFT JOIN cat_clinicas c ON f.cd_clinica = c.cd_clinica
    WHERE f.no_expf = %s
"""

SQL_FOTOS = """
    SELECT
        id_empleado,
        tipo_foto,
        foto,
        pk_num,
        id_clave_foto
    FROM dnt_fotos_credenciales
    WHERE id_empleado = %s
"""


def _dictfetchall(cursor) -> list[dict]:
    """Convierte el resultado de un cursor raw en lista de dicts con keys en MAYÚSCULAS."""
    cols = [col[0].upper() for col in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


# ──────────────────────────────────────────────────────────────
# Caso de uso principal
# ──────────────────────────────────────────────────────────────

def buscar_expediente(id_empleado: str) -> dict:
    empleados: list[dict] = []
    familiares: list[dict] = []

    if not id_empleado:
        return {'empleados': empleados, 'familiares': familiares}

    try:
        with connections['expedientes'].cursor() as cursor:
            cursor.execute(SQL_EMPLEADO, [id_empleado])
            empleados = _dictfetchall(cursor)

            cursor.execute(SQL_FAMILIAR, [id_empleado])
            familiares = _dictfetchall(cursor)

            cursor.execute(SQL_FOTOS, [id_empleado])
            fotos = _dictfetchall(cursor)

    except Exception as exc:
        logger.error("Error consultando expediente %s: %s", id_empleado, exc)
        return {'empleados': [], 'familiares': []}

    # ── Procesar fotos → base64 ──────────────────────────────
    fotos_procesadas = []
    for foto in fotos:
        if foto.get('FOTO'):
            foto['FOTO_B64'] = optimizar_imagen(bytes(foto['FOTO']))
        else:
            foto['FOTO_B64'] = None
        fotos_procesadas.append(foto)

    # ── Asignar foto al empleado (TIPO_FOTO == 'T') ──────────
    for empleado in empleados:
        empleado['FOTO'] = None
        for foto in fotos_procesadas:
            if (
                str(foto['ID_EMPLEADO']) == str(empleado['NO_EXP'])
                and str(foto.get('TIPO_FOTO', '')) == 'T'
            ):
                empleado['FOTO'] = foto['FOTO_B64']
                break
        empleado['EDAD'] = calcular_edad(empleado.get('FE_NAC'))

    # ── Asignar foto a familiares (match por ID_EMPLEADO + PK_NUM) ──
    for familiar in familiares:
        familiar['FOTO'] = None
        for foto in fotos_procesadas:
            if (
                str(foto['ID_EMPLEADO']) == str(familiar['NO_EXPF'])
                and str(foto.get('PK_NUM')) == str(familiar['PK_NUM'])
            ):
                familiar['FOTO'] = foto['FOTO_B64']
                break
        familiar['EDAD'] = calcular_edad(familiar.get('FE_NAC'))

    logger.info(
        "Expediente %s → empleados: %d | familiares: %d | fotos: %d",
        id_empleado, len(empleados), len(familiares), len(fotos_procesadas),
    )

    return {'empleados': empleados, 'familiares': familiares}