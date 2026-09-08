import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0024_medicamentos'),
        ('consulta_medica', '0015_visitdiagnosis'),
    ]

    operations = [
        migrations.CreateModel(
            name='VisitPrescriptionItem',
            fields=[
                ('id_prescription_item', models.BigAutoField(db_column='id_receta_item', primary_key=True, serialize=False)),
                ('dose', models.CharField(blank=True, db_column='dosis', max_length=100, null=True)),
                ('indications', models.CharField(db_column='indicaciones', max_length=140)),
                ('quantity', models.PositiveIntegerField(db_column='cantidad')),
                ('status', models.CharField(choices=[('activo', 'Activo'), ('cancelado', 'Cancelado')], db_column='estatus', default='activo', max_length=20)),
                ('is_active', models.BooleanField(db_column='est_activo', default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='fch_alta')),
                ('updated_at', models.DateTimeField(auto_now=True, db_column='fch_modf')),
                ('deleted_at', models.DateTimeField(blank=True, db_column='fch_baja', null=True)),
                ('created_by_id', models.BigIntegerField(blank=True, db_column='usr_alta', null=True)),
                ('updated_by_id', models.BigIntegerField(blank=True, db_column='usr_modf', null=True)),
                ('deleted_by_id', models.BigIntegerField(blank=True, db_column='usr_baja', null=True)),
                ('prescription', models.ForeignKey(db_column='id_receta', on_delete=django.db.models.deletion.PROTECT, related_name='structured_items', to='consulta_medica.visitprescription')),
                ('medication', models.ForeignKey(db_column='id_medic', on_delete=django.db.models.deletion.PROTECT, related_name='+', to='catalogos.medicamentos')),
            ],
            options={
                'db_table': 'cns_visit_prescription_item',
            },
        ),
        migrations.AddIndex(
            model_name='visitprescriptionitem',
            index=models.Index(fields=['prescription'], name='cns_rxitem_prescription_idx'),
        ),
        migrations.AddIndex(
            model_name='visitprescriptionitem',
            index=models.Index(fields=['is_active'], name='cns_rxitem_active_idx'),
        ),
        migrations.AddConstraint(
            model_name='visitprescriptionitem',
            constraint=models.UniqueConstraint(condition=models.Q(('status', 'activo')), fields=('prescription', 'medication'), name='cns_rxitem_one_active_per_medication'),
        ),
    ]
