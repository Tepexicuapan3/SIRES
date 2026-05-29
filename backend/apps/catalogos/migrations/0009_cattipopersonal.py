from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalogos", "0008_vacunas_alter_catcies_code_alter_catcies_version"),
    ]

    operations = [
        migrations.CreateModel(
            name="CatTipoPersonal",
            fields=[
                ("id_tipo_personal", models.BigAutoField(primary_key=True, serialize=False, db_column="id_tipo_personal")),
                ("nombre", models.CharField(max_length=80, db_column="nombre")),
                ("est_activo", models.BooleanField(db_column="est_activo", default=True)),
                ("fch_alta", models.DateTimeField(auto_now_add=True, db_column="fch_alta")),
                ("fch_modf", models.DateTimeField(blank=True, db_column="fch_modf", null=True)),
                ("fch_baja", models.DateTimeField(blank=True, db_column="fch_baja", null=True)),
                ("usr_alta", models.BigIntegerField(blank=True, db_column="usr_alta", null=True)),
                ("usr_modf", models.BigIntegerField(blank=True, db_column="usr_modf", null=True)),
                ("usr_baja", models.BigIntegerField(blank=True, db_column="usr_baja", null=True)),
            ],
            options={
                "db_table": "cat_tipo_personal",
                "managed": True,
            },
        ),
    ]
