from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0006_visit_pknum_smallint_to_int"),
    ]

    operations = [
        migrations.AddField(
            model_name="visit",
            name="hora_consulta",
            field=models.TimeField(db_column="hora_consulta", null=True, blank=True),
        ),
    ]
