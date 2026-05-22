from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0005_visit_nombre_paciente"),
    ]

    operations = [
        migrations.AlterField(
            model_name="visit",
            name="pk_num",
            field=models.IntegerField(db_column="pk_num", default=0),
        ),
    ]
