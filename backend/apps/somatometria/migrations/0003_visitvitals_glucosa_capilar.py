from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("somatometria", "0002_visitvitals_waist_circumference_cm"),
    ]

    operations = [
        migrations.AddField(
            model_name="visitvitalsigns",
            name="glucosa_capilar_mgdl",
            field=models.PositiveSmallIntegerField(
                blank=True,
                db_column="glucosa_capilar_mgdl",
                null=True,
            ),
        ),
    ]
