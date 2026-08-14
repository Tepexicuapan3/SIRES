# Mismo patron que 0005_sucursal_fk_integrity para el otro campo de texto
# libre pendiente de esa auditoria: ContratoOxigeno.especialidad ahora
# apunta a catalogos.Especialidades. A diferencia de sucursal, este campo
# es opcional (blank=True) y en la practica esta vacio en todas las filas
# reales verificadas -- igual se backfillea por nombre (case-insensitive)
# por las dudas de que produccion tenga datos que el entorno de desarrollo
# no tiene, y se frena con el detalle si algo no matchea en vez de perder
# el dato o aplicarse a medias.
import django.db.models.deletion
from django.db import migrations, models


def backfill_especialidad_fk(apps, schema_editor):
    ContratoOxigeno = apps.get_model("contratos_oxigeno", "ContratoOxigeno")
    Especialidades = apps.get_model("catalogos", "Especialidades")

    catalogo_por_nombre = {e.name.strip().upper(): e.id for e in Especialidades.objects.all()}

    sin_match = []
    for contrato in ContratoOxigeno.objects.exclude(especialidad_legacy=""):
        clave = (contrato.especialidad_legacy or "").strip().upper()
        especialidad_id = catalogo_por_nombre.get(clave)
        if especialidad_id is None:
            sin_match.append((contrato.pk, contrato.especialidad_legacy))
            continue
        contrato.especialidad_id = especialidad_id
        contrato.save(update_fields=["especialidad"])

    if sin_match:
        detalle = ", ".join(f"contrato #{pk} (especialidad={valor!r})" for pk, valor in sin_match)
        raise RuntimeError(
            "No se pudo mapear 'especialidad' a catalogos.Especialidades para: "
            f"{detalle}. Agrega esos valores al catalogo (o corrige el dato) "
            "y vuelve a correr la migracion."
        )


def backfill_especialidad_fk_reverse(apps, schema_editor):
    ContratoOxigeno = apps.get_model("contratos_oxigeno", "ContratoOxigeno")
    for contrato in ContratoOxigeno.objects.select_related("especialidad").all():
        contrato.especialidad_legacy = contrato.especialidad.name if contrato.especialidad_id else ""
        contrato.save(update_fields=["especialidad_legacy"])


class Migration(migrations.Migration):

    dependencies = [
        ("contratos_oxigeno", "0005_sucursal_fk_integrity"),
        ("catalogos", "0018_centro_horario_excepcion_protect"),
    ]

    operations = [
        migrations.RenameField(
            model_name="contratooxigeno",
            old_name="especialidad",
            new_name="especialidad_legacy",
        ),
        migrations.AddField(
            model_name="contratooxigeno",
            name="especialidad",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="catalogos.especialidades",
                related_name="contratos_oxigeno",
            ),
        ),
        migrations.RunPython(backfill_especialidad_fk, backfill_especialidad_fk_reverse),
        migrations.RemoveField(
            model_name="contratooxigeno",
            name="especialidad_legacy",
        ),
    ]
