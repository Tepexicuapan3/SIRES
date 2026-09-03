import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0021_citaestatuslog"),
        ("catalogos", "0002_areas_autorizadores_bajas_calidadlaboral_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="visit",
            name="tipo_cita",
            field=models.ForeignKey(
                db_column="tipo_cita_id",
                db_constraint=False,
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogos.tipodecitas",
                related_name="visitas",
            ),
        ),
    ]
