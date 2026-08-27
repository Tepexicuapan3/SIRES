# PatientLatestVitals estaba indexado SOLO por `no_exp`, pero `no_exp` es
# compartido por todo el nucleo familiar (titular + derechohabientes,
# distinguidos por `pk_num` en `recepcion.Visit`). Consecuencia real: el
# cache mezclaba signos vitales entre personas distintas de la misma
# familia (ver spec "Integridad del cache por persona").
#
# Fix: la clave efectiva pasa a ser el PAR (`no_exp`, `pk_num`), con un
# `BigAutoField` surrogate (`id_latest`) como PK real y un
# `UniqueConstraint(no_exp, pk_num)` que garantiza una sola fila cacheada
# por integrante familiar.
#
# DeleteModel + CreateModel en UNA sola migracion en vez de un ALTER
# in-place: Django no permite tener dos PKs a la vez sobre el mismo
# modelo, y un `ADD COLUMN bigserial` in-place reescribe la tabla entera
# (ACCESS EXCLUSIVE) para terminar igual tirando todas las filas via el
# RunPython. DROP+CREATE son operaciones de metadata (instantaneas) y
# Postgres tiene DDL transaccional, asi que toda la migracion corre
# atomica (default de Django) -- no queda ventana con la tabla ausente
# ni un estado intermedio observable.
#
# El RunPython reconstruye el cache desde `VisitVitalSigns` JOIN `Visit`
# (la fuente de verdad clinica, que nunca se sobreescribe), agrupando por
# (no_exp, pk_num) y quedandose con la fila mas reciente por `fch_alta`.
# Las filas legacy del cache viejo que sean inatribuibles a un
# (no_exp, pk_num) puntual se DESCARTAN en vez de backfillearse con un
# pk_num adivinado -- este es un cache derivado/desechable, nunca el
# historial clinico (aprobado explicitamente en la propuesta del change).
#
# IMPORTANTE (D2): `config/settings.py` fuerza SQLite `:memory:` cuando
# "test" in sys.argv, y las migraciones corren en los tests. Por eso el
# rebuild NO puede usar `QuerySet.distinct(*fields)` ni `RunSQL` con
# `DISTINCT ON` (sintaxis exclusiva de Postgres) -- el dedupe se hace en
# Python puro sobre un queryset ya ordenado.
#
# IMPORTANTE (D3): `fch_modf` es `auto_now=True`. `bulk_create` y
# `bulk_update` disparan `pre_save` y pisarian el timestamp con la hora
# de la migracion (la enfermera veria "ultima consulta" con fecha de hoy
# para vitales de hace meses -- dato clinico falso). `QuerySet.update()`
# no dispara `auto_now`, asi que cada fila se crea primero y despues se
# corrige `fch_modf` con el `fch_alta` real de la captura de origen.
import django.db.models.deletion
from django.db import migrations, models


def _rebuild_latest_vitals_by_person(apps, schema_editor):
    Latest = apps.get_model("somatometria", "PatientLatestVitals")
    VisitVitalSigns = apps.get_model("somatometria", "VisitVitalSigns")

    rows = (
        VisitVitalSigns.objects.select_related("id_visit")
        .exclude(id_visit__no_exp__isnull=True)
        .exclude(id_visit__no_exp="")
        .exclude(id_visit__status__in=("cancelada", "no_show"))
        .order_by("id_visit__no_exp", "id_visit__pk_num", "-fch_alta")
    )

    seen = set()
    stamps = {}
    for row in rows.iterator(chunk_size=2000):
        key = (row.id_visit.no_exp, row.id_visit.pk_num)
        if key in seen:
            continue
        seen.add(key)

        latest = Latest.objects.create(
            no_exp=key[0],
            pk_num=key[1],
            weight_kg=row.weight_kg,
            height_cm=row.height_cm,
            temperature_c=row.temperature_c,
            oxygen_saturation_pct=row.oxygen_saturation_pct,
            heart_rate_bpm=row.heart_rate_bpm,
            respiratory_rate_bpm=row.respiratory_rate_bpm,
            blood_pressure_systolic=row.blood_pressure_systolic,
            blood_pressure_diastolic=row.blood_pressure_diastolic,
            waist_circumference_cm=row.waist_circumference_cm,
            bmi=row.bmi,
            glucosa_capilar_mgdl=row.glucosa_capilar_mgdl,
            id_visit_origen_id=row.id_visit_id,
        )
        # D3: create() dispara auto_now (fch_modf = "ahora"). Se corrige
        # con .update(), que NO dispara auto_now, para que fch_modf quede
        # igual al fch_alta real de la captura de origen.
        stamps[latest.pk] = row.fch_alta

    for pk, fch_alta in stamps.items():
        Latest.objects.filter(pk=pk).update(fch_modf=fch_alta)


def _noop_reverse(apps, schema_editor):
    # El reverse de este RunPython es intencionalmente un no-op: la tabla
    # vieja (no_exp como PK unica, sin pk_num) se recrea vacia por el
    # reverse automatico del CreateModel/DeleteModel de esta misma
    # migracion. No se intenta repoblarla, porque su propio schema no
    # puede distinguir integrantes del mismo no_exp -- fabricar una fila
    # "ganadora" por no_exp perderia exactamente la distincion que este
    # change vino a arreglar. Es un cache derivado y desechable: se
    # vuelve a poblar solo con la siguiente captura de signos vitales.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("somatometria", "0004_patientlatestvitals"),
    ]

    operations = [
        migrations.DeleteModel(
            name="PatientLatestVitals",
        ),
        migrations.CreateModel(
            name="PatientLatestVitals",
            fields=[
                ("id_latest", models.BigAutoField(db_column="id_latest", primary_key=True, serialize=False)),
                ("no_exp", models.CharField(db_column="no_exp", db_index=True, max_length=20)),
                ("pk_num", models.IntegerField(db_column="pk_num", default=0)),
                ("weight_kg", models.DecimalField(db_column="weight_kg", decimal_places=2, max_digits=6)),
                ("height_cm", models.DecimalField(db_column="height_cm", decimal_places=2, max_digits=6)),
                ("temperature_c", models.DecimalField(blank=True, db_column="temperature_c", decimal_places=1, max_digits=4, null=True)),
                ("oxygen_saturation_pct", models.PositiveSmallIntegerField(blank=True, db_column="oxygen_saturation_pct", null=True)),
                ("heart_rate_bpm", models.PositiveSmallIntegerField(blank=True, db_column="heart_rate_bpm", null=True)),
                ("respiratory_rate_bpm", models.PositiveSmallIntegerField(blank=True, db_column="respiratory_rate_bpm", null=True)),
                ("blood_pressure_systolic", models.PositiveSmallIntegerField(blank=True, db_column="blood_pressure_systolic", null=True)),
                ("blood_pressure_diastolic", models.PositiveSmallIntegerField(blank=True, db_column="blood_pressure_diastolic", null=True)),
                ("waist_circumference_cm", models.PositiveSmallIntegerField(blank=True, db_column="waist_circumference_cm", null=True)),
                ("bmi", models.DecimalField(db_column="bmi", decimal_places=2, max_digits=6)),
                ("glucosa_capilar_mgdl", models.PositiveSmallIntegerField(blank=True, db_column="glucosa_capilar_mgdl", null=True)),
                ("fch_modf", models.DateTimeField(auto_now=True, db_column="fch_modf")),
                (
                    "id_visit_origen",
                    models.ForeignKey(
                        blank=True,
                        db_column="id_visit_origen",
                        help_text="Visita de la que vino esta ultima captura (trazabilidad del cache).",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="recepcion.visit",
                    ),
                ),
            ],
            options={
                "db_table": "smt_patient_latest_vitals",
            },
        ),
        migrations.AddConstraint(
            model_name="patientlatestvitals",
            constraint=models.UniqueConstraint(
                fields=("no_exp", "pk_num"),
                name="smt_latest_vitals_noexp_pknum_uq",
            ),
        ),
        migrations.RunPython(_rebuild_latest_vitals_by_person, _noop_reverse),
    ]
