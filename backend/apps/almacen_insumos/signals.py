from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.almacen_insumos.models.kardex import (
    ConsumoConsultaDetalle,
    EntradaInventarioDetail,
    KardexMovimiento,
    SalidaInventario,
    SalidaInventarioDetail,
)
from apps.almacen_insumos.services import kardex_service

_SALIDA_TIPO_MAP = {
    SalidaInventario.TipoSalida.SALIDA:     KardexMovimiento.TipoMovimiento.SALIDA,
    SalidaInventario.TipoSalida.MERMA:      KardexMovimiento.TipoMovimiento.MERMA,
    SalidaInventario.TipoSalida.DEVOLUCION: KardexMovimiento.TipoMovimiento.DEVOLUCION,
}


@receiver(post_save, sender=EntradaInventarioDetail)
def on_entrada_detail_saved(sender, instance: EntradaInventarioDetail, created: bool, **kwargs):
    if not created:
        return

    kardex_service.registrar_movimiento(
        insumo=instance.id_insumo,
        lote=instance.id_lote,
        almacen=instance.id_entrada.id_almacen,
        tipo=KardexMovimiento.TipoMovimiento.ENTRADA,
        cantidad=instance.cantidad,
        ref_modelo="EntradaInventarioDetail",
        ref_id=instance.pk,
        created_by_id=instance.id_entrada.created_by_id,
    )


@receiver(post_save, sender=SalidaInventarioDetail)
def on_salida_detail_saved(sender, instance: SalidaInventarioDetail, created: bool, **kwargs):
    if not created:
        return

    tipo = _SALIDA_TIPO_MAP[instance.id_salida.tipo_salida]
    kardex_service.registrar_movimiento(
        insumo=instance.id_insumo,
        lote=instance.id_lote,
        almacen=instance.id_salida.id_almacen,
        tipo=tipo,
        cantidad=instance.cantidad,
        ref_modelo="SalidaInventarioDetail",
        ref_id=instance.pk,
        created_by_id=instance.id_salida.created_by_id,
    )


@receiver(post_save, sender=ConsumoConsultaDetalle)
def on_consumo_detail_saved(sender, instance: ConsumoConsultaDetalle, created: bool, **kwargs):
    if not created:
        return

    kardex_service.registrar_movimiento(
        insumo=instance.id_insumo,
        lote=instance.id_lote,
        almacen=instance.id_consumo.id_almacen,
        tipo=KardexMovimiento.TipoMovimiento.CONSUMO,
        cantidad=instance.cantidad,
        ref_modelo="ConsumoConsultaDetalle",
        ref_id=instance.pk,
        created_by_id=instance.id_consumo.created_by_id,
    )
