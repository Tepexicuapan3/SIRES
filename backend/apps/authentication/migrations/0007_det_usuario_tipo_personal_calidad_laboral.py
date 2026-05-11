from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0006_det_usuario_escolaridad_escuela"),
    ]

    operations = [
        migrations.AddField(
            model_name="detusuario",
            name="tipo_personal",
            field=models.CharField(
                db_column="tipo_personal",
                max_length=20,
                null=True,
                blank=True,
                choices=[
                    ("MEDICO", "Médico"),
                    ("ENFERMERIA", "Enfermería"),
                    ("ADMINISTRATIVO", "Administrativo"),
                ],
            ),
        ),
    ]
