from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("somatometria", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="visitvitalsigns",
            name="waist_circumference_cm",
            field=models.PositiveSmallIntegerField(
                blank=True,
                db_column="waist_circumference_cm",
                null=True,
            ),
        ),
    ]
