"""
Servicio de sincronización Oracle → PostgreSQL.

Replica registros de un expediente concreto comparando llaves primarias
y fechas de actualización entre la BD origen (Oracle) y la BD destino (PostgreSQL/Django).

Equivalente al ``actualizar_tabla`` del módulo Flask original.
"""

from __future__ import annotations

import gc
import logging
import time
import zlib
from concurrent.futures import ThreadPoolExecutor
from typing import Any

try:
    import oracledb
except ModuleNotFoundError:  # pragma: no cover - depends on image build
    oracledb = None
from django.conf import settings
from django.db import connections

logger = logging.getLogger(__name__)


def _require_oracledb() -> Any:
    if oracledb is None:
        raise RuntimeError("oracledb no esta disponible en la imagen del backend")
    return oracledb


# ──────────────────────────────────────────────────────────────
# Helpers de bajo nivel (cursores raw)
# ──────────────────────────────────────────────────────────────

def _dividir_lista(lista: list, tamano: int):
    """Generador que parte una lista en bloques de tamaño ``tamano``."""
    for i in range(0, len(lista), tamano):
        yield lista[i:i + tamano]


def _procesar_blob(fila: tuple[Any, ...], indices_blob: list[int]) -> tuple[Any, ...]:
    """Comprime con zlib los campos LOB de una fila de Oracle."""
    db_driver = _require_oracledb()
    fila_editable: list[Any] = list(fila)
    for i in indices_blob:
        if isinstance(fila_editable[i], db_driver.LOB):
            fila_editable[i] = zlib.compress(fila_editable[i].read())
    return tuple(fila_editable)


def _fetch_llaves_oracle(cursor, pk_str: str, tabla: str, no_exp: str,
                         expediente: str, batch_size: int) -> set:
    cursor.execute(
        f"SELECT {pk_str} FROM {tabla} WHERE {no_exp} = :1", (expediente,)
    )
    llaves: set = set()
    while True:
        rows = cursor.fetchmany(batch_size)
        if not rows:
            break
        for row in rows:
            llaves.add(tuple(row))
    return llaves


def _fetch_llaves_postgres(cursor, pk_str: str, tabla: str, no_exp: str,
                           expediente: str, batch_size: int) -> set:
    cursor.execute(
        f'SELECT {pk_str} FROM "{tabla}" WHERE "{no_exp}" = %s', (expediente,)
    )
    llaves: set = set()
    while True:
        rows = cursor.fetchmany(batch_size)
        if not rows:
            break
        for row in rows:
            llaves.add(tuple(row))
    return llaves


def _fetch_fechas_oracle(cursor, pk_str: str, fec_act: str, tabla: str,
                         no_exp: str, expediente: str, batch_size: int) -> dict:
    cursor.execute(
        f"SELECT {pk_str}, {fec_act} FROM {tabla} WHERE {no_exp} = :1", (expediente,)
    )
    idx = len(pk_str.split(","))
    resultado: dict = {}
    while True:
        rows = cursor.fetchmany(batch_size)
        if not rows:
            break
        resultado.update({tuple(row[:idx]): row[idx] for row in rows})
    return resultado


def _fetch_fechas_postgres(cursor, pk_str: str, fec_act: str, tabla: str,
                           no_exp: str, expediente: str, batch_size: int) -> dict:
    cursor.execute(
        f'SELECT {pk_str}, {fec_act} FROM "{tabla}" WHERE "{no_exp}" = %s', (expediente,)
    )
    idx = len(pk_str.split(","))
    resultado: dict = {}
    while True:
        rows = cursor.fetchmany(batch_size)
        if not rows:
            break
        resultado.update({tuple(row[:idx]): row[idx] for row in rows})
    return resultado


# ──────────────────────────────────────────────────────────────
# Conexión Oracle
# ──────────────────────────────────────────────────────────────

def obtener_conexion_oracle() -> Any:
    db_driver = _require_oracledb()
    cfg = settings.ORACLE_CONFIG
    try:
        db_driver.init_oracle_client(lib_dir=cfg.get('instant_client_dir', r'C:\oracle\instantclient_11_2'))
    except db_driver.ProgrammingError:
        pass  # Ya fue inicializado anteriormente, ignorar
    dsn = db_driver.makedsn(cfg['host'], cfg['port'], service_name=cfg['service_name'])
    return db_driver.connect(user=cfg['user'], password=cfg['password'], dsn=dsn)


# ──────────────────────────────────────────────────────────────
# Función principal de sincronización
# ──────────────────────────────────────────────────────────────

BATCH_SIZE = 155


def sincronizar_tabla(
    oracle_conn: Any,
    tabla: str,
    llaves_primarias: list[str],
    fec_actualizacion: str,
    no_exp: str,
    expediente: str,
) -> dict[str, int]:
    logger.info("Sincronizando tabla: %s – expediente: %s", tabla.upper(), expediente)
    conteos = {'insertados': 0, 'eliminados': 0, 'actualizados': 0}

    oracle_cursor = oracle_conn.cursor()

    pg_conn = connections['expedientes']
    with pg_conn.cursor() as pg_cursor:

        # ── Obtener columnas dinámicamente desde PostgreSQL ──────────────
        pg_cursor.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position
        """, (tabla,))
        columnas_info = pg_cursor.fetchall()

        if not columnas_info:
            logger.warning("Tabla '%s' no encontrada en PostgreSQL.", tabla)
            return conteos

        columnas        = [c[0] for c in columnas_info]
        columnas_blob   = [c[0] for c in columnas_info if c[1].lower() in ('bytea',)]
        columnas_act    = [c for c in columnas if c not in llaves_primarias]
        pk_str          = ", ".join(llaves_primarias)

        # Para PostgreSQL: columnas entre comillas (case-sensitive, minúsculas)
        col_str         = ", ".join(f'"{c}"' for c in columnas)
        col_act_str     = ", ".join(f'"{c}"' for c in columnas_act)

        # Para Oracle: columnas sin comillas (Oracle las convierte a mayúsculas automáticamente)
        col_str_ora     = ", ".join(columnas)
        col_act_str_ora = ", ".join(columnas_act)

        # ── Obtener llaves de ambas BDs ──────────────────────────────────
        llaves_oracle = _fetch_llaves_oracle(
            oracle_cursor, pk_str, tabla, no_exp, expediente, BATCH_SIZE
        )
        llaves_pg = _fetch_llaves_postgres(
            pg_cursor, pk_str, tabla, no_exp, expediente, BATCH_SIZE
        )

        nuevos     = list(llaves_oracle - llaves_pg)
        eliminados = list(llaves_pg - llaves_oracle)
        logger.info("  ↳ Nuevos: %d | Eliminados: %d", len(nuevos), len(eliminados))

        # ── DELETE ──────────────────────────────────────────────────────
        if eliminados:
            t0 = time.time()
            where_pk = " AND ".join(f'"{c}" = %s' for c in llaves_primarias)
            sql_del  = f'DELETE FROM "{tabla}" WHERE {where_pk}'
            for bloque in _dividir_lista(eliminados, BATCH_SIZE):
                try:
                    pg_cursor.executemany(sql_del, bloque)
                    conteos['eliminados'] += pg_cursor.rowcount
                except Exception as exc:
                    logger.error("Error DELETE en %s: %s", tabla, exc)
            pg_conn.connection.commit()
            logger.info("  ↳ Eliminados en %.2fs", time.time() - t0)

        # ── INSERT ──────────────────────────────────────────────────────
        if nuevos:
            t0 = time.time()
            ph_pg   = ", ".join(["%s"] * len(columnas))
            sql_ins = f'INSERT INTO "{tabla}" ({col_str}) VALUES ({ph_pg})'

            for bloque in _dividir_lista(nuevos, BATCH_SIZE):
                if len(llaves_primarias) == 1:
                    ph_ora = ", ".join(f":{i+1}" for i in range(len(bloque)))
                    sql_sel = f"""
                        SELECT {col_str_ora} FROM (
                            SELECT t.*, ROW_NUMBER() OVER (
                                PARTITION BY t.{llaves_primarias[0]}
                                ORDER BY t.{fec_actualizacion} DESC NULLS LAST
                            ) AS rn
                            FROM {tabla} t
                            WHERE {llaves_primarias[0]} IN ({ph_ora})
                        ) sub WHERE rn = 1
                    """
                    vals_sel: list[Any] = [p[0] for p in bloque]
                else:
                    conds = ' OR '.join(
                        '(' + ' AND '.join(
                            f"t.{c} = :{i * len(llaves_primarias) + j + 1}"
                            for j, c in enumerate(llaves_primarias)
                        ) + ')'
                        for i, _ in enumerate(bloque)
                    )
                    part  = ", ".join(f"t.{c}" for c in llaves_primarias)
                    sql_sel = f"""
                        SELECT {col_str_ora} FROM (
                            SELECT t.*, ROW_NUMBER() OVER (
                                PARTITION BY {part}
                                ORDER BY t.{fec_actualizacion} DESC NULLS LAST
                            ) AS rn
                            FROM {tabla} t WHERE {conds}
                        ) sub WHERE rn = 1
                    """
                    vals_sel = [v for par in bloque for v in par]

                oracle_cursor.execute(sql_sel, vals_sel)
                rows = oracle_cursor.fetchall()

                if columnas_blob:
                    indices_blob = [i for i, c in enumerate(columnas) if c in columnas_blob]
                    with ThreadPoolExecutor(max_workers=4) as ex:
                        rows = sum(
                            ex.map(
                                lambda chunk: [_procesar_blob(f, indices_blob) for f in chunk],
                                _dividir_lista(rows, 50),
                            ),
                            [],
                        )

                try:
                    pg_cursor.executemany(sql_ins, rows)
                    conteos['insertados'] += pg_cursor.rowcount
                    pg_conn.connection.commit()
                except Exception as exc:
                    logger.error("Error INSERT en %s: %s", tabla, exc)

            logger.info("  ↳ Insertados en %.2fs", time.time() - t0)

        # ── UPDATE ──────────────────────────────────────────────────────
        fechas_oracle = _fetch_fechas_oracle(
            oracle_cursor, pk_str, fec_actualizacion, tabla, no_exp, expediente, BATCH_SIZE
        )
        fechas_pg = _fetch_fechas_postgres(
            pg_cursor, pk_str, fec_actualizacion, tabla, no_exp, expediente, BATCH_SIZE
        )

        actualizar = [k for k in fechas_pg if fechas_pg.get(k) != fechas_oracle.get(k)]
        logger.info("  ↳ Por actualizar: %d", len(actualizar))

        if actualizar:
            t0 = time.time()
            set_clause   = ", ".join(f'"{c}" = %s' for c in columnas_act)
            where_clause = " AND ".join(f'"{c}" = %s' for c in llaves_primarias)
            sql_upd = f'UPDATE "{tabla}" SET {set_clause} WHERE {where_clause}'

            for bloque in _dividir_lista(actualizar, BATCH_SIZE):
                if len(llaves_primarias) == 1:
                    ph_ora = ", ".join(f":{i+1}" for i in range(len(bloque)))
                    sql_sel = f"""
                        SELECT {col_act_str_ora}, {pk_str} FROM (
                            SELECT t.*, ROW_NUMBER() OVER (
                                PARTITION BY t.{llaves_primarias[0]}
                                ORDER BY t.{fec_actualizacion} DESC NULLS LAST
                            ) AS rn
                            FROM {tabla} t
                            WHERE {llaves_primarias[0]} IN ({ph_ora})
                        ) sub WHERE rn = 1
                    """
                    vals_sel = [p[0] for p in bloque]
                else:
                    conds = ' OR '.join(
                        '(' + ' AND '.join(
                            f"t.{c} = :{i * len(llaves_primarias) + j + 1}"
                            for j, c in enumerate(llaves_primarias)
                        ) + ')'
                        for i, _ in enumerate(bloque)
                    )
                    part  = ", ".join(f"t.{c}" for c in llaves_primarias)
                    sql_sel = f"""
                        SELECT {col_act_str_ora}, {pk_str} FROM (
                            SELECT t.*, ROW_NUMBER() OVER (
                                PARTITION BY {part}
                                ORDER BY t.{fec_actualizacion} DESC NULLS LAST
                            ) AS rn
                            FROM {tabla} t WHERE {conds}
                        ) sub WHERE rn = 1
                    """
                    vals_sel = [v for par in bloque for v in par]

                oracle_cursor.execute(sql_sel, vals_sel)
                rows = oracle_cursor.fetchall()

                if columnas_blob:
                    indices_blob = [
                        i for i, c in enumerate(columnas_act + llaves_primarias)
                        if c in columnas_blob
                    ]
                    with ThreadPoolExecutor(max_workers=4) as ex:
                        rows = sum(
                            ex.map(
                                lambda chunk: [_procesar_blob(f, indices_blob) for f in chunk],
                                _dividir_lista(rows, 50),
                            ),
                            [],
                        )

                try:
                    pg_cursor.executemany(sql_upd, rows)
                    conteos['actualizados'] += pg_cursor.rowcount
                    pg_conn.connection.commit()
                except Exception as exc:
                    logger.error("Error UPDATE en %s: %s", tabla, exc)

            logger.info("  ↳ Actualizados en %.2fs", time.time() - t0)

    oracle_cursor.close()
    gc.collect()
    return conteos
