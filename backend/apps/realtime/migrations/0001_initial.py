from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="RealtimeSequence",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("stream_key", models.CharField(db_column="stream_key", max_length=64, unique=True)),
                ("last_sequence", models.BigIntegerField(db_column="last_sequence", default=0)),
                ("fch_modf", models.DateTimeField(auto_now=True, db_column="fch_modf")),
            ],
            options={
                "db_table": "rt_realtime_sequences",
            },
        ),
    ]
