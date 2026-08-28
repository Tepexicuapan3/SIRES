# Generated manually (molde `portal_citas/migrations/0001_initial.py`)
"""
Migración inicial del módulo Comunicados: modelo `Anuncio` (tabla
`com_anuncios`), el flyer que el personal administrativo de SISEM publica
y que se muestra como banner en el portal de citas (change
`anuncios-portal-citas`). Tabla `managed=True` -- Django la crea y
administra, a diferencia de los catálogos replicados desde Oracle.
"""

import apps.comunicados.storage
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Anuncio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=150)),
                ('descripcion', models.TextField(blank=True, default='')),
                ('imagen', models.ImageField(max_length=255, upload_to=apps.comunicados.storage.anuncio_upload_to)),
                ('adjunto_pdf', models.FileField(blank=True, max_length=255, null=True, upload_to=apps.comunicados.storage.adjunto_upload_to)),
                ('enlace_url', models.URLField(blank=True, default='', max_length=500)),
                ('vigencia_desde', models.DateField()),
                ('vigencia_hasta', models.DateField(blank=True, null=True)),
                ('activo', models.BooleanField(default=True)),
                ('orden', models.PositiveSmallIntegerField(default=0)),
                ('creado_por_id', models.BigIntegerField(blank=True, db_column='usr_alta', null=True)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('actualizado_en', models.DateTimeField(auto_now=True)),
                ('eliminado_en', models.DateTimeField(blank=True, default=None, null=True)),
            ],
            options={
                'db_table': 'com_anuncios',
                'ordering': ['orden', '-vigencia_desde'],
            },
        ),
        migrations.AddIndex(
            model_name='anuncio',
            index=models.Index(fields=['activo', 'vigencia_desde', 'vigencia_hasta'], name='com_anuncio_vigencia_idx'),
        ),
        migrations.AddIndex(
            model_name='anuncio',
            index=models.Index(fields=['activo', 'orden'], name='com_anuncio_activo_orden_idx'),
        ),
        migrations.AddConstraint(
            model_name='anuncio',
            constraint=models.CheckConstraint(
                condition=models.Q(('vigencia_hasta__isnull', True), ('vigencia_hasta__gte', models.F('vigencia_desde')), _connector='OR'),
                name='com_anuncio_vigencia_coherente',
            ),
        ),
    ]
