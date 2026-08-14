# Visit.doctor_id vivia como entero suelto aunque siempre referencio a
# authentication.SyUsuario (verificado: 0 huerfanos contra esa tabla en
# datos reales, y visit_repository.py / ficha_service.py ya lo resuelven
# via DetUsuario.objects.filter(id_usuario_id=visit.doctor_id) -- la
# aplicacion siempre lo trato como un id de usuario, nunca como texto).
#
# db_column="doctor_id" se mantiene identico, asi que el RenameField no
# genera SQL de columna -- el AlterField que sigue solo agrega la
# constraint FK sobre los valores ya cargados. El indice compuesto se
# recrea porque el nombre del campo Python cambio (la columna fisica no).
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0018_horariodisponible_idx_consultorio_fecha_canal"),
        ("authentication", "0012_remove_detusuario_tipo_personal_text"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="visit",
            name="rcp_visits_doc_status_idx",
        ),
        migrations.RenameField(
            model_name="visit",
            old_name="doctor_id",
            new_name="doctor",
        ),
        migrations.AlterField(
            model_name="visit",
            name="doctor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="authentication.syusuario",
                db_column="doctor_id",
                related_name="visitas_atendidas",
            ),
        ),
        migrations.AddIndex(
            model_name="visit",
            index=models.Index(fields=["doctor", "status"], name="rcp_visits_doc_status_idx"),
        ),
    ]
