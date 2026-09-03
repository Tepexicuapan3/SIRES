import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0023_visit_motivo_cancelacion"),
        ("catalogos", "0021_motivos_cita"),
    ]

    operations = [
        # 1) Preservar el texto libre existente: se renombra la columna
        #    (RenameField hace un ALTER TABLE RENAME COLUMN, no pierde
        #    datos), NUNCA RemoveField+AddField con el mismo nombre.
        migrations.RenameField(
            model_name="citamedica",
            old_name="motivo_cancelacion",
            new_name="motivo_detalle",
        ),
        migrations.RenameField(
            model_name="visit",
            old_name="motivo_cancelacion",
            new_name="motivo_detalle",
        ),
        # 1.1) Visit.motivo_cancelacion (migracion 0023) declaraba
        #      db_column="motivo_cancelacion" explicito, asi que el
        #      RenameField de arriba solo renombra el atributo Python (el
        #      state todavia apunta a la columna fisica vieja). Este
        #      AlterField completa el rename fisico de la columna (misma
        #      operacion interna que RenameField -- ALTER TABLE RENAME
        #      COLUMN, no pierde datos) para que quede alineada con el
        #      nuevo campo `motivo_detalle` sin db_column explicito.
        migrations.AlterField(
            model_name="visit",
            name="motivo_detalle",
            field=models.TextField(blank=True, null=True),
        ),
        # 2) Agregar el motivo tipificado (catálogo) como columna nueva,
        #    nullable — no rompe filas existentes.
        migrations.AddField(
            model_name="citamedica",
            name="motivo_cancelacion",
            field=models.ForeignKey(
                db_column="motivo_cancelacion_id",
                db_constraint=False,
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogos.motivocita",
                related_name="citas_canceladas",
            ),
        ),
        migrations.AddField(
            model_name="visit",
            name="motivo_cancelacion",
            field=models.ForeignKey(
                db_column="motivo_cancelacion_id",
                db_constraint=False,
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogos.motivocita",
                related_name="visitas_canceladas",
            ),
        ),
    ]
