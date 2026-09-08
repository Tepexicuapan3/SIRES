import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pases', '0001_initial'),
        ('consulta_medica', '0013_odontogramtooth'),
    ]

    operations = [
        migrations.AddField(
            model_name='studyresult',
            name='referral_study',
            field=models.ForeignKey(
                blank=True,
                db_column='id_pase_estudio',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='results',
                to='pases.referralstudydetail',
            ),
        ),
    ]
