from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0023_catcentroatencion_add_instituto'),
    ]

    operations = [
        migrations.CreateModel(
            name='Medicamentos',
            fields=[
                ('id', models.BigAutoField(db_column='id_medic', primary_key=True, serialize=False)),
                ('is_active', models.BooleanField(db_column='est_activo', default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='fch_alta')),
                ('updated_at', models.DateTimeField(blank=True, db_column='fch_modf', null=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_column='fch_baja', null=True)),
                ('created_by_id', models.BigIntegerField(blank=True, db_column='usr_alta', null=True)),
                ('updated_by_id', models.BigIntegerField(blank=True, db_column='usr_modf', null=True)),
                ('deleted_by_id', models.BigIntegerField(blank=True, db_column='usr_baja', null=True)),
                ('name', models.CharField(db_column='ds_medic', max_length=150)),
                ('generic_name', models.CharField(blank=True, db_column='ds_activo', max_length=150, null=True)),
                ('presentation', models.CharField(blank=True, db_column='presentacion', max_length=150, null=True)),
                ('cuadro_basico', models.CharField(choices=[('BASICO', 'Cuadro Básico'), ('ESPECIAL', 'Especial'), ('INSTITUCIONAL', 'Institucional')], db_column='sw_cbasico', default='BASICO', max_length=20)),
                ('is_controlled', models.BooleanField(db_column='es_controlado', default=False)),
                ('max_quantity', models.PositiveIntegerField(blank=True, db_column='no_caja', null=True)),
            ],
            options={
                'db_table': 'cat_medicamentos',
            },
        ),
    ]
