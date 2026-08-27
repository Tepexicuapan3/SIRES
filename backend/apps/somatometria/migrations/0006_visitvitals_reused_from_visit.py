# Fase 2 del reuso mismo dia: agrega la FK de auditoria `reused_from_visit`
# a `VisitVitalSigns`. Es SOLO un sello de trazabilidad NOM-024 -- el
# servidor nunca copia valores del origen, los valores guardados siempre
# vienen del payload de la captura actual (ver design D5).
#
# on_delete=PROTECT (D4): `rg` confirmo que no existe ningun `visit.delete()`
# en el codigo -- la baja de una visita es siempre logica (`fch_baja`), asi
# que PROTECT nunca se dispara en la practica y la traza queda no-borrable.
#
# El indice sobre `fch_alta` soporta el lookup de "captura de hoy" por
# persona (`get_latest_today_for_patient`), que filtra por
# `fch_alta__date=timezone.localdate()`.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0020_visit_noexp_pknum_idx"),
        ("somatometria", "0005_latest_vitals_pknum_rebuild"),
    ]

    operations = [
        migrations.AddField(
            model_name="visitvitalsigns",
            name="reused_from_visit",
            field=models.ForeignKey(
                blank=True,
                db_column="reused_from_visit",
                help_text=(
                    "Visita origen cuando esta captura reusa signos vitales "
                    "tomados hoy en otra visita del mismo paciente "
                    "(trazabilidad NOM-024). El servidor NUNCA copia valores "
                    "del origen: los que se guardan aca son siempre los que "
                    "vienen en el payload de esta captura."
                ),
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="reused_vital_signs",
                to="recepcion.visit",
            ),
        ),
        migrations.AddIndex(
            model_name="visitvitalsigns",
            index=models.Index(fields=["fch_alta"], name="smt_visit_vitals_fchalta_idx"),
        ),
    ]
