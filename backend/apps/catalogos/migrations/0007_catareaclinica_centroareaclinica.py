from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0006_catcentroatencionhorario_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CatAreaClinica',
            fields=[
                ('is_active', models.BooleanField(db_column='est_activo', default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='fch_alta')),
                ('updated_at', models.DateTimeField(blank=True, db_column='fch_modf', null=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_column='fch_baja', null=True)),
                ('created_by_id', models.BigIntegerField(blank=True, db_column='usr_alta', null=True)),
                ('updated_by_id', models.BigIntegerField(blank=True, db_column='usr_modf', null=True)),
                ('deleted_by_id', models.BigIntegerField(blank=True, db_column='usr_baja', null=True)),
                ('id', models.AutoField(db_column='id_area_clinica', primary_key=True, serialize=False)),
                ('name', models.CharField(db_column='nombre', max_length=150, unique=True)),
            ],
            options={
                'verbose_name': 'Área Clínica',
                'verbose_name_plural': 'Áreas Clínicas',
                'db_table': 'cat_areas_clinicas',
                'ordering': ['name'],
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='CentroAreaClinica',
            fields=[
                ('is_active', models.BooleanField(db_column='est_activo', default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='fch_alta')),
                ('updated_at', models.DateTimeField(blank=True, db_column='fch_modf', null=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_column='fch_baja', null=True)),
                ('created_by_id', models.BigIntegerField(blank=True, db_column='usr_alta', null=True)),
                ('updated_by_id', models.BigIntegerField(blank=True, db_column='usr_modf', null=True)),
                ('deleted_by_id', models.BigIntegerField(blank=True, db_column='usr_baja', null=True)),
                ('center', models.ForeignKey(
                    db_column='id_centro_atencion',
                    on_delete=models.deletion.CASCADE,
                    primary_key=True,
                    related_name='clinical_areas',
                    serialize=False,
                    to='catalogos.catcentroatencion',
                )),
                ('area_clinica', models.ForeignKey(
                    db_column='id_area_clinica',
                    on_delete=models.deletion.RESTRICT,
                    related_name='centers',
                    to='catalogos.catareaclinica',
                )),
            ],
            options={
                'verbose_name': 'Área Clínica por Centro',
                'verbose_name_plural': 'Áreas Clínicas por Centro',
                'db_table': 'centro_area_clinica',
                'managed': False,
            },
        ),
    ]
