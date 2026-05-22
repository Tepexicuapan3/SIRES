"""
Agrega nombre_paciente a rcp_visits (desnormalizado desde cat_empleados/cat_familiar
en el momento del check-in para poder imprimir la ficha sin consultar el expediente).
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0004_citas_medicas"),
    ]

    operations = [
        migrations.AddField(
            model_name="visit",
            name="nombre_paciente",
            field=models.CharField(
                db_column="nombre_paciente",
                max_length=255,
                null=True,
                blank=True,
            ),
        ),
    ]
