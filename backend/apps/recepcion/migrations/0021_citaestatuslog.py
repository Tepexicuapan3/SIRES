import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recepcion', '0020_visit_noexp_pknum_idx'),
    ]

    operations = [
        migrations.CreateModel(
            name='CitaEstatusLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_status', models.CharField(blank=True, db_column='from_status', max_length=20, null=True)),
                ('to_status', models.CharField(db_column='to_status', max_length=20)),
                ('changed_by_id', models.BigIntegerField(blank=True, db_column='changed_by_id', null=True)),
                ('changed_at', models.DateTimeField(auto_now_add=True, db_column='changed_at')),
                ('notes', models.CharField(blank=True, db_column='notes', max_length=255, null=True)),
                ('cita', models.ForeignKey(db_column='cita_id', on_delete=django.db.models.deletion.CASCADE, related_name='estatus_logs', to='recepcion.citamedica')),
            ],
            options={
                'db_table': 'citas_estatus_log',
                'ordering': ['changed_at'],
            },
        ),
    ]
