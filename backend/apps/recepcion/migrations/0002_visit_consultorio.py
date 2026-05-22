import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0001_initial"),
        ("catalogos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="visit",
            name="consultorio",
            field=models.ForeignKey(
                db_column="consultorio_id",
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogos.consultorios",
                related_name="visitas",
            ),
        ),
    ]
