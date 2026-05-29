from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0009_det_usuario_tipo_personal_fk"),
    ]

    operations = [
        # Ampliar el campo tipo de 20 a 80 chars y quitar choices (texto libre)
        migrations.AlterField(
            model_name="detusuariocedula",
            name="tipo",
            field=models.CharField(
                max_length=80,
                default="",
                db_column="tipo",
            ),
        ),
    ]
