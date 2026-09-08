import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('consulta_medica', '0014_studyresult_referral_study'),
    ]

    operations = [
        migrations.CreateModel(
            name='VisitDiagnosis',
            fields=[
                ('id_visit_diagnosis', models.BigAutoField(db_column='id_diagnostico', primary_key=True, serialize=False)),
                ('notes', models.CharField(blank=True, db_column='notas', max_length=255, null=True)),
                ('status', models.CharField(choices=[('activo', 'Activo'), ('cancelado', 'Cancelado')], db_column='estatus', default='activo', max_length=20)),
                ('is_active', models.BooleanField(db_column='est_activo', default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='fch_alta')),
                ('updated_at', models.DateTimeField(auto_now=True, db_column='fch_modf')),
                ('deleted_at', models.DateTimeField(blank=True, db_column='fch_baja', null=True)),
                ('created_by_id', models.BigIntegerField(blank=True, db_column='usr_alta', null=True)),
                ('updated_by_id', models.BigIntegerField(blank=True, db_column='usr_modf', null=True)),
                ('deleted_by_id', models.BigIntegerField(blank=True, db_column='usr_baja', null=True)),
                ('consultation', models.ForeignKey(db_column='id_consulta', on_delete=django.db.models.deletion.PROTECT, related_name='secondary_diagnoses', to='consulta_medica.visitconsultation')),
                ('cie', models.ForeignKey(db_column='clave_cie', on_delete=django.db.models.deletion.PROTECT, related_name='+', to='catalogos.catcies')),
            ],
            options={
                'db_table': 'cns_visit_diagnosis',
            },
        ),
        migrations.AddIndex(
            model_name='visitdiagnosis',
            index=models.Index(fields=['consultation'], name='cns_visitdiag_consult_idx'),
        ),
        migrations.AddIndex(
            model_name='visitdiagnosis',
            index=models.Index(fields=['is_active'], name='cns_visitdiag_active_idx'),
        ),
        migrations.AddConstraint(
            model_name='visitdiagnosis',
            constraint=models.UniqueConstraint(condition=models.Q(('status', 'activo')), fields=('consultation', 'cie'), name='cns_visit_diagnosis_one_active_per_cie'),
        ),
    ]
