import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0005_det_usuario_cd_laboral"),
        ("catalogos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="detusuario",
            name="id_escolaridad",
            field=models.ForeignKey(
                db_column="id_escolaridad",
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogos.escolaridad",
            ),
        ),
        migrations.AddField(
            model_name="detusuario",
            name="id_escuela",
            field=models.ForeignKey(
                db_column="id_escuela",
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogos.escuelas",
            ),
        ),
    ]
