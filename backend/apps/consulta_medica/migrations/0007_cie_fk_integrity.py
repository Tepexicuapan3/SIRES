# VisitConsultation.cie_code era CharField(8) suelto aunque
# consultation_usecase._resolve_cie_code_or_error ya validaba contra
# catalogos.CatCies en el UNICO path de escritura (ConsultationRepository.
# upsert_for_visit) antes de guardar -- 0 huerfanos verificados en datos
# reales. Se agrega la FK real como respaldo a nivel de base de datos,
# ademas de la validacion de aplicacion que ya existia.
#
# db_column="clave_cie" se mantiene identico (RenameField no genera SQL de
# columna); el AlterField solo agrega la constraint FK. El campo Python se
# renombra a "cie" (no "cie_code") porque la columna destino usa una PK de
# texto (CatCies.code) -- Django ya no puede exponer el shadow attribute
# como "cie_code" (seria distinto de un simple sufijo _id), asi que los
# ~5 call sites que leian/escribian .cie_code pasan a usar el shadow
# attribute estandar .cie_id (mismo valor, mismo tipo).
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("consulta_medica", "0006_doctor_fk_integrity"),
        ("catalogos", "0017_catcies_codigo_unique"),
    ]

    operations = [
        migrations.RenameField(
            model_name="visitconsultation",
            old_name="cie_code",
            new_name="cie",
        ),
        migrations.AlterField(
            model_name="visitconsultation",
            name="cie",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="catalogos.catcies",
                db_column="clave_cie",
                related_name="consultas",
            ),
        ),
    ]
