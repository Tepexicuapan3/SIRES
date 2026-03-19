from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="visit",
            name="service_type",
            field=models.CharField(
                choices=[
                    ("medicina_general", "medicina_general"),
                    ("especialidad", "especialidad"),
                    ("urgencias", "urgencias"),
                ],
                db_column="service_type",
                default="medicina_general",
                max_length=32,
            ),
        ),
    ]
