# Indice compuesto (no_exp, pk_num) sobre rcp_visits. Soporta el JOIN
# VisitVitalSigns -> Visit que el reuso de signos vitales del mismo dia
# (change somatometria-reuso-signos-mismo-dia, Fase 2) usa para ubicar
# capturas de HOY del mismo integrante familiar. `no_exp` ya tenia
# db_index propio; este indice compuesto evita un scan adicional por
# pk_num sobre ese resultado.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0019_doctor_fk_integrity"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="visit",
            index=models.Index(fields=["no_exp", "pk_num"], name="rcp_visits_noexp_pknum_idx"),
        ),
    ]
