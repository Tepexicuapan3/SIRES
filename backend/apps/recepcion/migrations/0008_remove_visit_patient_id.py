from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0007_visit_hora_consulta"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="visit",
            name="patient_id",
        ),
    ]
