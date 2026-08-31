# Denormaliza `no_exp`/`pk_num` directo en `smt_visit_vitals` (antes solo
# alcanzables via JOIN contra `recepcion.Visit`, que ya esta indexado por
# (no_exp, pk_num) y cubre los casos de uso actuales de la app). Esto es
# para que reportes/consultas directas sobre esta tabla no necesiten el
# JOIN -- no cambia el comportamiento de ningun endpoint existente.
#
# Bajo riesgo de inconsistencia: `no_exp`/`pk_num` de una visita no cambian
# despues de creada (se fijan al check-in), asi que la copia denormalizada
# no se desincroniza con el uso normal del sistema.
#
# `no_exp` se agrega NULLABLE primero, se rellena desde `id_visit` (fuente
# de verdad, FK obligatoria -- toda fila existente tiene una visita valida,
# a diferencia del caso de `PatientLatestVitals` en la migracion 0005, que
# tenia filas huerfanas por diseno de cache viejo) y recien despues se
# vuelve NOT NULL. `pk_num` no necesita el mismo cuidado: tiene
# `default=0` desde el modelo, correcto para todas las filas hasta que el
# RunPython lo corrija con el valor real de cada visita.
from django.db import migrations, models


def _backfill_no_exp_pk_num(apps, schema_editor):
    VisitVitalSigns = apps.get_model("somatometria", "VisitVitalSigns")

    rows = VisitVitalSigns.objects.select_related("id_visit").only(
        "id_vitals", "id_visit__no_exp", "id_visit__pk_num"
    )

    for row in rows.iterator(chunk_size=2000):
        VisitVitalSigns.objects.filter(pk=row.pk).update(
            no_exp=row.id_visit.no_exp,
            pk_num=row.id_visit.pk_num,
        )


def _noop_reverse(apps, schema_editor):
    # No hace falta deshacer el backfill: al revertir la migracion, las
    # columnas mismas desaparecen (RemoveField automatico del reverse de
    # AddField). No hay estado que limpiar aparte.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("somatometria", "0007_visitvitals_captured_by_updated_by"),
    ]

    operations = [
        migrations.AddField(
            model_name="visitvitalsigns",
            name="no_exp",
            field=models.CharField(
                db_column="no_exp", max_length=20, null=True,
            ),
        ),
        migrations.AddField(
            model_name="visitvitalsigns",
            name="pk_num",
            field=models.IntegerField(db_column="pk_num", default=0),
        ),
        migrations.RunPython(_backfill_no_exp_pk_num, _noop_reverse),
        migrations.AlterField(
            model_name="visitvitalsigns",
            name="no_exp",
            field=models.CharField(db_column="no_exp", max_length=20),
        ),
        migrations.AddIndex(
            model_name="visitvitalsigns",
            index=models.Index(
                fields=["no_exp", "pk_num"],
                name="smt_vitals_noexp_pknum_idx",
            ),
        ),
    ]
