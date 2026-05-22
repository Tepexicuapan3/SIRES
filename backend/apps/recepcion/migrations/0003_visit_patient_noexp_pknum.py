"""
Agrega no_exp y pk_num a rcp_visits para identificar pacientes
mediante el número de expediente y el identificador de miembro familiar.

- no_exp  → expediente del titular (cat_empleados.no_exp)
- pk_num  → 0 = titular, >0 = derechohabiente (cat_familiar.pk_num)

patient_id pasa a nullable para mantener compatibilidad con registros
de demostración anteriores. Los nuevos registros usan no_exp + pk_num.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0002_visit_consultorio"),
    ]

    operations = [
        # Identificación real del paciente
        migrations.AddField(
            model_name="visit",
            name="no_exp",
            field=models.CharField(
                max_length=20,
                db_column="no_exp",
                db_index=True,
                null=True,
                blank=True,
            ),
        ),
        migrations.AddField(
            model_name="visit",
            name="pk_num",
            field=models.SmallIntegerField(
                db_column="pk_num",
                default=0,
            ),
        ),
        # patient_id → nullable (compatibilidad con datos de demostración)
        migrations.AlterField(
            model_name="visit",
            name="patient_id",
            field=models.BigIntegerField(
                db_column="patient_id",
                db_index=True,
                null=True,
                blank=True,
            ),
        ),
    ]
