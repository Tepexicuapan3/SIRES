from django.db import models


class Visit(models.Model):
    id_visit = models.BigAutoField(primary_key=True, db_column="id_visit")
    patient_id = models.BigIntegerField(db_column="patient_id", db_index=True)
    has_appointment = models.BooleanField(db_column="has_appointment", default=False)
    status = models.CharField(max_length=32, db_column="status", db_index=True)
    fch_alta = models.DateTimeField(auto_now_add=True, db_column="fch_alta")
    fch_modf = models.DateTimeField(auto_now=True, db_column="fch_modf")

    class Meta:
        db_table = "rcp_visits"
        indexes = [
            models.Index(fields=["status"], name="rcp_visits_status_idx"),
        ]
