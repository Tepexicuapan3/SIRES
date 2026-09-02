import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("consulta_medica", "0007_cie_fk_integrity"),
        ("catalogos", "0017_catcies_codigo_unique"),
    ]

    operations = [
        migrations.CreateModel(
            name="VisitConsultationRevision",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("previous_primary_diagnosis", models.CharField(db_column="diagnostico_primario_anterior", max_length=255)),
                ("previous_final_note", models.TextField(db_column="nota_final_anterior")),
                ("changed_by_id", models.BigIntegerField(blank=True, db_column="usr_modf", null=True)),
                ("changed_at", models.DateTimeField(auto_now_add=True, db_column="fch_modf")),
                ("consultation", models.ForeignKey(db_column="id_consulta", on_delete=django.db.models.deletion.CASCADE, related_name="revisions", to="consulta_medica.visitconsultation")),
                ("previous_cie", models.ForeignKey(blank=True, db_column="clave_cie_anterior", null=True, on_delete=django.db.models.deletion.PROTECT, related_name="+", to="catalogos.catcies")),
            ],
            options={
                "db_table": "cns_visit_consultation_revision",
                "ordering": ["changed_at"],
            },
        ),
    ]
