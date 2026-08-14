# ContratoOxigeno.sucursal vivia como texto libre (CharField) aunque el
# formulario del frontend ya restringe su captura a un combobox poblado por
# catalogos.CatSucursal -- el dato nunca fue realmente "libre", solo le
# faltaba la constraint. Se convierte a FK real preservando cada valor ya
# cargado: primero se renombra la columna vieja (mismo tipo, sin tocar
# datos), se agrega la FK nueva en null=True, se resuelve cada fila por
# nombre (case-insensitive) via RunPython, y solo si TODAS las filas
# encontraron su catalogo se borra la columna vieja y se vuelve la FK
# obligatoria. Si algo no matchea, la migracion frena con el detalle en
# vez de aplicarse a medias o perder el dato.
import django.db.models.deletion
from django.db import migrations, models


def backfill_sucursal_fk(apps, schema_editor):
    ContratoOxigeno = apps.get_model("contratos_oxigeno", "ContratoOxigeno")
    CatSucursal = apps.get_model("catalogos", "CatSucursal")

    catalogo_por_nombre = {c.name.strip().upper(): c.id for c in CatSucursal.objects.all()}

    sin_match = []
    for contrato in ContratoOxigeno.objects.all():
        clave = (contrato.sucursal_legacy or "").strip().upper()
        sucursal_id = catalogo_por_nombre.get(clave)
        if sucursal_id is None:
            sin_match.append((contrato.pk, contrato.sucursal_legacy))
            continue
        contrato.sucursal_id = sucursal_id
        contrato.save(update_fields=["sucursal"])

    if sin_match:
        detalle = ", ".join(f"contrato #{pk} (sucursal={valor!r})" for pk, valor in sin_match)
        raise RuntimeError(
            "No se pudo mapear 'sucursal' a catalogos.CatSucursal para: "
            f"{detalle}. Agrega esos valores al catalogo (o corrige el dato) "
            "y vuelve a correr la migracion."
        )


def backfill_sucursal_fk_reverse(apps, schema_editor):
    ContratoOxigeno = apps.get_model("contratos_oxigeno", "ContratoOxigeno")
    for contrato in ContratoOxigeno.objects.select_related("sucursal").all():
        contrato.sucursal_legacy = contrato.sucursal.name if contrato.sucursal_id else ""
        contrato.save(update_fields=["sucursal_legacy"])


class Migration(migrations.Migration):

    dependencies = [
        ("contratos_oxigeno", "0004_contratooxigeno_fecha_nacimiento"),
        ("catalogos", "0016_autorizadores_fk_integrity"),
    ]

    operations = [
        migrations.RenameField(
            model_name="contratooxigeno",
            old_name="sucursal",
            new_name="sucursal_legacy",
        ),
        migrations.AddField(
            model_name="contratooxigeno",
            name="sucursal",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="catalogos.catsucursal",
                related_name="contratos_oxigeno",
            ),
        ),
        migrations.RunPython(backfill_sucursal_fk, backfill_sucursal_fk_reverse),
        migrations.RemoveField(
            model_name="contratooxigeno",
            name="sucursal_legacy",
        ),
        migrations.AlterField(
            model_name="contratooxigeno",
            name="sucursal",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                to="catalogos.catsucursal",
                related_name="contratos_oxigeno",
            ),
        ),
    ]
