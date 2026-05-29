from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0008_det_usuario_info_adicional"),
        ("catalogos", "0009_cattipopersonal"),
    ]

    operations = [
        migrations.AddField(
            model_name="detusuario",
            name="id_tipo_personal",
            field=models.ForeignKey(
                blank=True,
                db_column="id_tipo_personal",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogos.cattipopersonal",
            ),
        ),
    ]
