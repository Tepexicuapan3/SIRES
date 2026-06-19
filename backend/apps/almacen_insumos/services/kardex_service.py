"""
kardex_service — ÚNICO punto de escritura para ExistenciaAlmacen y KardexMovimiento.

Nadie más debe modificar esas tablas directamente.
"""
from __future__ import annotations

from decimal import Decimal

from django.db import transaction

from apps.almacen_insumos.models.kardex import (
    ExistenciaAlmacen,
    KardexMovimiento,
    LoteInsumo,
)
from apps.almacen_insumos.models.catalogos import Almacen, CatInsumo


class InsufficientStockError(Exception):
    """Stock disponible menor a la cantidad solicitada."""


_TIPOS_ENTRADA = frozenset(
    [
        KardexMovimiento.TipoMovimiento.ENTRADA,
        KardexMovimiento.TipoMovimiento.DEVOLUCION,
        KardexMovimiento.TipoMovimiento.AJUSTE_POSITIVO,
    ]
)

_TIPOS_SALIDA = frozenset(
    [
        KardexMovimiento.TipoMovimiento.SALIDA,
        KardexMovimiento.TipoMovimiento.MERMA,
        KardexMovimiento.TipoMovimiento.CONSUMO,
        KardexMovimiento.TipoMovimiento.AJUSTE_NEGATIVO,
    ]
)


def registrar_movimiento(
    *,
    insumo: CatInsumo,
    lote: LoteInsumo | None,
    almacen: Almacen,
    tipo: KardexMovimiento.TipoMovimiento,
    cantidad: Decimal,
    ref_modelo: str,
    ref_id: int,
    created_by_id: int | None = None,
) -> KardexMovimiento:
    """Registra un movimiento en el kardex y actualiza el saldo.

    Requiere cantidad > 0 para todos los tipos.
    Para SALIDA/MERMA/CONSUMO/AJUSTE_NEGATIVO valida stock suficiente.
    Lanza InsufficientStockError si el stock resultaría negativo.
    """
    if cantidad <= Decimal("0"):
        raise ValueError("La cantidad debe ser mayor a cero")

    with transaction.atomic():
        existencia, _ = ExistenciaAlmacen.objects.select_for_update().get_or_create(
            id_insumo=insumo,
            id_lote=lote,
            id_almacen=almacen,
            defaults={"cantidad": Decimal("0")},
        )

        if tipo in _TIPOS_ENTRADA:
            existencia.cantidad += cantidad
        elif tipo in _TIPOS_SALIDA:
            if existencia.cantidad < cantidad:
                raise InsufficientStockError(
                    f"Stock insuficiente para '{insumo.nombre}': "
                    f"disponible={existencia.cantidad}, solicitado={cantidad}"
                )
            existencia.cantidad -= cantidad
        else:
            raise ValueError(f"Tipo de movimiento desconocido: {tipo}")

        existencia.save(update_fields=["cantidad"])

        movimiento = KardexMovimiento.objects.create(
            id_insumo=insumo,
            id_lote=lote,
            id_almacen=almacen,
            tipo_movimiento=tipo,
            cantidad=cantidad,
            saldo_resultante=existencia.cantidad,
            ref_modelo=ref_modelo,
            ref_id=ref_id,
            created_by_id=created_by_id,
        )

    return movimiento


def get_existencia(
    *,
    insumo: CatInsumo,
    lote: LoteInsumo | None,
    almacen: Almacen,
) -> Decimal:
    """Retorna el saldo actual. Devuelve 0 si no existe registro."""
    try:
        return ExistenciaAlmacen.objects.get(
            id_insumo=insumo, id_lote=lote, id_almacen=almacen
        ).cantidad
    except ExistenciaAlmacen.DoesNotExist:
        return Decimal("0")


def recompute_existencia(almacen: Almacen) -> int:
    """Recalcula ExistenciaAlmacen desde cero leyendo el ledger.

    Para uso administrativo y recuperación de inconsistencias.
    Retorna la cantidad de filas actualizadas.
    """
    from django.db.models import DecimalField, Sum, Value
    from django.db.models.functions import Coalesce

    _zero = Value(Decimal("0"), output_field=DecimalField(max_digits=14, decimal_places=4))

    combinaciones = (
        KardexMovimiento.objects.filter(id_almacen=almacen)
        .values_list("id_insumo_id", "id_lote_id", "id_almacen_id")
        .distinct()
    )

    registros_actualizados = 0
    for id_insumo, id_lote, id_almacen_val in combinaciones:
        qs = KardexMovimiento.objects.filter(
            id_insumo_id=id_insumo,
            id_lote_id=id_lote,
            id_almacen_id=id_almacen_val,
        )

        entradas = qs.filter(tipo_movimiento__in=list(_TIPOS_ENTRADA)).aggregate(
            total=Coalesce(Sum("cantidad"), _zero)
        )["total"]

        salidas = qs.filter(tipo_movimiento__in=list(_TIPOS_SALIDA)).aggregate(
            total=Coalesce(Sum("cantidad"), _zero)
        )["total"]

        saldo = max(entradas - salidas, Decimal("0"))

        ExistenciaAlmacen.objects.update_or_create(
            id_insumo_id=id_insumo,
            id_lote_id=id_lote,
            id_almacen_id=id_almacen_val,
            defaults={"cantidad": saldo},
        )
        registros_actualizados += 1

    return registros_actualizados
