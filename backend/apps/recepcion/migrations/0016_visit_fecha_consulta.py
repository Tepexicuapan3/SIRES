from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0015_fix_status_log_schema"),
    ]

    operations = [
        migrations.AddField(
            model_name="visit",
            name="fecha_consulta",
            field=models.DateField(db_column="fecha_consulta", null=True, blank=True),
        ),
    ]
