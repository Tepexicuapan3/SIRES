# VacInventario nacio managed=False (0001_initial) sin que Django la creara
# nunca: la tabla se genero a mano en los ambientes que la tienen. Ademas esa
# migracion quedo incompleta -- nunca incluyo los campos FK "vaccine" y
# "center" (id_vacuna / id_centro_atencion) que el modelo si tiene, porque el
# 0001_initial se copio a mano de otra migracion en vez de generarse con
# makemigrations.
#
# Mismo patron que 0013_create_missing_catalog_tables en catalogos: el
# estado pasa a managed=True (con las FKs que faltaban), y la creacion
# fisica solo ocurre si la tabla todavia no existe -- asi no rompe los
# ambientes donde ya fue creada a mano con datos reales cargados.
import django.db.models.deletion
from django.apps import apps as global_apps
from django.db import migrations, models


def crear_tabla_si_no_existe(apps, schema_editor):
    tablas_existentes = set(schema_editor.connection.introspection.table_names())
    model = global_apps.get_model("farmacia", "vacinventario")
    if model._meta.db_table in tablas_existentes:
        return
    schema_editor.create_model(model)


def revertir_noop(apps, schema_editor):
    # No se borra la tabla al revertir: podria tener datos reales cargados.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("farmacia", "0001_initial"),
        ("catalogos", "0015_reconcile_catcentroatencion_drift"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name="vacinventario",
                    name="vaccine",
                    field=models.ForeignKey(
                        db_column="id_vacuna",
                        default=None,
                        on_delete=django.db.models.deletion.RESTRICT,
                        related_name="inventario",
                        to="catalogos.vacunas",
                    ),
                    preserve_default=False,
                ),
                migrations.AddField(
                    model_name="vacinventario",
                    name="center",
                    field=models.ForeignKey(
                        db_column="id_centro_atencion",
                        default=None,
                        on_delete=django.db.models.deletion.RESTRICT,
                        related_name="inventario_vacunas",
                        to="catalogos.catcentroatencion",
                    ),
                    preserve_default=False,
                ),
                migrations.AlterModelOptions(
                    name="vacinventario",
                    options={"managed": True},
                ),
            ],
            database_operations=[
                migrations.RunPython(crear_tabla_si_no_existe, revertir_noop),
            ],
        ),
    ]
