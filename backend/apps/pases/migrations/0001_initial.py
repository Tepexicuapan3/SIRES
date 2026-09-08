import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('catalogos', '0023_catcentroatencion_add_instituto'),
        ('consulta_medica', '0013_odontogramtooth'),
    ]

    operations = [
        migrations.CreateModel(
            name='Referral',
            fields=[
                ('id_referral', models.BigAutoField(db_column='id_pase', primary_key=True, serialize=False)),
                ('no_exp', models.CharField(db_column='no_exp', db_index=True, max_length=20)),
                ('pk_num', models.IntegerField(db_column='pk_num', default=0)),
                ('referral_type', models.CharField(choices=[('laboratorio', 'Laboratorio'), ('gabinete', 'Gabinete'), ('especialidad', 'Especialidad'), ('hospitalizacion', 'Hospitalización'), ('tercer_nivel', 'Tercer Nivel')], db_column='tipo_pase', max_length=20)),
                ('requested_care', models.TextField(blank=True, db_column='atencion_solicitada', null=True)),
                ('visit_type', models.CharField(blank=True, choices=[('primera_vez', 'Primera Vez'), ('subsecuente', 'Subsecuente')], db_column='tp_cita', max_length=20, null=True)),
                ('folio', models.CharField(db_column='folio', max_length=32, unique=True)),
                ('status', models.CharField(choices=[('activo', 'Activo'), ('cancelado', 'Cancelado')], db_column='estatus', default='activo', max_length=20)),
                ('is_active', models.BooleanField(db_column='est_activo', default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='fch_alta')),
                ('updated_at', models.DateTimeField(auto_now=True, db_column='fch_modf')),
                ('deleted_at', models.DateTimeField(blank=True, db_column='fch_baja', null=True)),
                ('created_by_id', models.BigIntegerField(blank=True, db_column='usr_alta', null=True)),
                ('updated_by_id', models.BigIntegerField(blank=True, db_column='usr_modf', null=True)),
                ('deleted_by_id', models.BigIntegerField(blank=True, db_column='usr_baja', null=True)),
                ('consultation', models.ForeignKey(db_column='id_consulta', on_delete=django.db.models.deletion.PROTECT, related_name='referrals', to='consulta_medica.visitconsultation')),
                ('destination_center', models.ForeignKey(blank=True, db_column='id_centro_destino', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='catalogos.catcentroatencion')),
                ('specialty', models.ForeignKey(blank=True, db_column='id_especialidad', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='catalogos.especialidades')),
                ('cancellation_reason', models.ForeignKey(blank=True, db_column='id_motivo_cancelacion', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='+', to='catalogos.motivocita')),
            ],
            options={
                'db_table': 'ref_referral',
            },
        ),
        migrations.CreateModel(
            name='ReferralStudyDetail',
            fields=[
                ('id_referral_study', models.BigAutoField(db_column='id_pase_estudio', primary_key=True, serialize=False)),
                ('cost_approved', models.BooleanField(db_column='costo_aprobado', default=False)),
                ('valid_until', models.DateField(blank=True, db_column='vigente_hasta', null=True)),
                ('status', models.CharField(choices=[('activo', 'Activo'), ('cancelado', 'Cancelado')], db_column='estatus', default='activo', max_length=20)),
                ('is_active', models.BooleanField(db_column='est_activo', default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='fch_alta')),
                ('updated_at', models.DateTimeField(auto_now=True, db_column='fch_modf')),
                ('deleted_at', models.DateTimeField(blank=True, db_column='fch_baja', null=True)),
                ('created_by_id', models.BigIntegerField(blank=True, db_column='usr_alta', null=True)),
                ('updated_by_id', models.BigIntegerField(blank=True, db_column='usr_modf', null=True)),
                ('deleted_by_id', models.BigIntegerField(blank=True, db_column='usr_baja', null=True)),
                ('referral', models.ForeignKey(db_column='id_pase', on_delete=django.db.models.deletion.PROTECT, related_name='study_details', to='pases.referral')),
                ('study_type', models.ForeignKey(db_column='id_estudio', on_delete=django.db.models.deletion.PROTECT, related_name='+', to='catalogos.estudiosmed')),
            ],
            options={
                'db_table': 'ref_referral_study',
            },
        ),
        migrations.AddIndex(
            model_name='referral',
            index=models.Index(fields=['no_exp', 'pk_num'], name='ref_referral_patient_idx'),
        ),
        migrations.AddIndex(
            model_name='referral',
            index=models.Index(fields=['is_active'], name='ref_referral_active_idx'),
        ),
        migrations.AddConstraint(
            model_name='referral',
            constraint=models.UniqueConstraint(condition=models.Q(('status', 'activo')), fields=('consultation', 'referral_type'), name='ref_referral_one_active_per_type'),
        ),
        migrations.AddIndex(
            model_name='referralstudydetail',
            index=models.Index(fields=['referral'], name='ref_refstudy_referral_idx'),
        ),
    ]
