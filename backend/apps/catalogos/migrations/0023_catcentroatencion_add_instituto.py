from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0022_religion_tiporesidencia'),
    ]

    operations = [
        migrations.AlterField(
            model_name='catcentroatencion',
            name='center_type',
            field=models.CharField(
                choices=[
                    ('CLINICA', 'Clínica'),
                    ('HOSPITAL', 'Hospital'),
                    ('INSTITUTO', 'Instituto'),
                ],
                db_column='tipo_centro',
                db_index=True,
                max_length=20,
            ),
        ),
    ]
