# Fase 2 del change somatometria-modulo-integral: agrega atribucion de
# autoria a `VisitVitalSigns` -- QUIEN tomo la medicion original
# (`captured_by`) y QUIEN la corrigio despues (`updated_by`), como DOS
# columnas independientes (ver design D4). Nunca se fusionan en un unico
# `changed_by`: la trazabilidad NOM-024 exige poder distinguir captura de
# correccion.
#
# FK a `authentication.SyUsuario` (NO `authentication.DetUsuario`): es el
# mismo modelo que ya usan `Visit.doctor`, `Visit.created_by` y
# `AuditoriaEvento.actor_usuario`. `DetUsuario` es solo la tabla de perfil
# (nombre_completo), no la identidad de autenticacion.
#
# on_delete=SET_NULL (a diferencia de `reused_from_visit`, que es PROTECT):
# la baja de un usuario NO debe bloquear la historia clinica -- la
# atribucion fuerte y no-borrable vive en `AuditoriaEvento`, esto es solo
# un atajo de lectura.
#
# Aditiva y nullable: `migrate somatometria 0006` sigue siendo un estado
# valido, sin perdida de datos.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("somatometria", "0006_visitvitals_reused_from_visit"),
        ("authentication", "0013_nombre_completo_generated"),
    ]

    operations = [
        migrations.AddField(
            model_name="visitvitalsigns",
            name="captured_by",
            field=models.ForeignKey(
                blank=True,
                db_column="captured_by",
                help_text=(
                    "Usuario que tomo la medicion original (atribucion "
                    "NOM-024). Nunca se reasigna en una correccion "
                    "posterior -- ver `updated_by`."
                ),
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="vitals_capturados",
                to="authentication.syusuario",
            ),
        ),
        migrations.AddField(
            model_name="visitvitalsigns",
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                db_column="updated_by",
                help_text=(
                    "Usuario que corrigio la medicion via edicion "
                    "auditada (Fase 3). `null` mientras la fila nunca fue "
                    "corregida -- nunca pisa a `captured_by`."
                ),
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="vitals_editados",
                to="authentication.syusuario",
            ),
        ),
    ]
