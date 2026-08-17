# Postgres cannot ALTER an existing plain column into a generated one -- the
# field must be removed and re-added with the new definition. Postgres
# auto-backfills STORED generated columns from existing row data when the
# column is added, so no data is lost.

import django.db.models.functions.comparison
import django.db.models.functions.text
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0012_remove_detusuario_tipo_personal_text'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='detusuario',
            name='nombre_completo',
        ),
        migrations.AddField(
            model_name='detusuario',
            name='nombre_completo',
            field=models.GeneratedField(db_index=True, db_persist=True, expression=django.db.models.functions.text.Trim(models.Func(django.db.models.functions.comparison.Coalesce(models.Func(django.db.models.functions.comparison.NullIf(models.F('nombre'), models.Value('')), models.Value(' '), arg_joiner=' || ', output_field=models.CharField(), template='%(expressions)s'), models.Value(''), output_field=models.CharField()), django.db.models.functions.comparison.Coalesce(models.Func(django.db.models.functions.comparison.NullIf(models.F('paterno'), models.Value('')), models.Value(' '), arg_joiner=' || ', output_field=models.CharField(), template='%(expressions)s'), models.Value(''), output_field=models.CharField()), django.db.models.functions.comparison.Coalesce(models.Func(django.db.models.functions.comparison.NullIf(models.F('materno'), models.Value('')), models.Value(' '), arg_joiner=' || ', output_field=models.CharField(), template='%(expressions)s'), models.Value(''), output_field=models.CharField()), arg_joiner=' || ', output_field=models.CharField(max_length=255), template='%(expressions)s')), output_field=models.CharField(max_length=255)),
        ),
    ]
