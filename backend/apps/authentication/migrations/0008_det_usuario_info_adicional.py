from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0007_det_usuario_tipo_personal_calidad_laboral"),
    ]

    operations = [
        migrations.AddField(
            model_name="detusuario",
            name="telefono",
            field=models.CharField(max_length=20, null=True, blank=True, db_column="telefono"),
        ),
        migrations.AddField(
            model_name="detusuario",
            name="direccion",
            field=models.CharField(max_length=255, null=True, blank=True, db_column="direccion"),
        ),
        migrations.AddField(
            model_name="detusuario",
            name="sexo",
            field=models.CharField(
                max_length=1, null=True, blank=True, db_column="sexo",
                choices=[("M", "Masculino"), ("F", "Femenino")],
            ),
        ),
        migrations.AddField(
            model_name="detusuario",
            name="fecha_nac",
            field=models.DateField(null=True, blank=True, db_column="fecha_nac"),
        ),
    ]
