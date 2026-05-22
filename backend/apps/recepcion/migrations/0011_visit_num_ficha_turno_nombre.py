from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0010_turno_ficha_config"),
    ]

    operations = [
        migrations.AddField(
            model_name="visit",
            name="num_ficha",
            field=models.PositiveSmallIntegerField(
                db_column="num_ficha", null=True, blank=True
            ),
        ),
        migrations.AddField(
            model_name="visit",
            name="turno_nombre",
            field=models.CharField(
                db_column="turno_nombre", max_length=50, null=True, blank=True
            ),
        ),
    ]
