from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0004_det_usuario_cedula_noexp_area_clinica"),
    ]

    operations = [
        migrations.AddField(
            model_name="detusuario",
            name="cd_laboral",
            field=models.CharField(
                db_column="cd_laboral",
                max_length=100,
                null=True,
                blank=True,
            ),
        ),
    ]
