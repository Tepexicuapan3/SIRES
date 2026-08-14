# Autorizadores.center_id / .authorization_type_id / .user_id vivian como
# enteros sueltos (BigIntegerField) aunque los tres apuntan a catalogos ya
# existentes (CatCentroAtencion, TpAutorizacion, authentication.SyUsuario) --
# sin FK real no habia integridad referencial ni proteccion contra borrar un
# centro/tipo/usuario que todavia tuviera autorizadores asociados.
#
# db_column se mantiene identico en los tres casos, asi que el RenameField
# (mismo tipo, solo cambia el nombre Python) no genera SQL de renombrado de
# columna. El AlterField que sigue es el que agrega la constraint FK real,
# sin tocar los valores ya cargados en la columna -- si existiera algun id
# huerfano, Postgres rechaza la migracion en vez de aplicarla a medias.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0015_reconcile_catcentroatencion_drift"),
        ("authentication", "0011_sesionusuario"),
    ]

    operations = [
        migrations.RenameField(
            model_name="autorizadores",
            old_name="center_id",
            new_name="center",
        ),
        migrations.RenameField(
            model_name="autorizadores",
            old_name="authorization_type_id",
            new_name="authorization_type",
        ),
        migrations.RenameField(
            model_name="autorizadores",
            old_name="user_id",
            new_name="user",
        ),
        migrations.AlterField(
            model_name="autorizadores",
            name="center",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                to="catalogos.catcentroatencion",
                db_column="id_centro_atencion",
                related_name="autorizadores",
            ),
        ),
        migrations.AlterField(
            model_name="autorizadores",
            name="authorization_type",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                to="catalogos.tpautorizacion",
                db_column="id_tpautorizacion",
                related_name="autorizadores",
            ),
        ),
        migrations.AlterField(
            model_name="autorizadores",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                to="authentication.syusuario",
                db_column="id_usuario",
                related_name="autorizaciones",
            ),
        ),
    ]
