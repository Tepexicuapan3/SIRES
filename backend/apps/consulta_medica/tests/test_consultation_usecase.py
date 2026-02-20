from django.test import TestCase

from apps.consulta_medica.models import VisitConsultation
from apps.consulta_medica.uses_case.consultation_usecase import (
    close_consultation,
    start_consultation,
)
from apps.recepcion.models import Visit
from apps.recepcion.services.errors import VisitDomainError


class ConsultationUseCaseTests(TestCase):
    def _visit(self, status):
        return Visit.objects.create(
            folio=f"CNS-{status}-{Visit.objects.count() + 1}",
            patient_id=5000 + Visit.objects.count() + 1,
            arrival_type=Visit.ArrivalType.APPOINTMENT,
            appointment_id=f"APP-{Visit.objects.count() + 1}",
            status=status,
        )

    def test_start_consultation_happy_path(self):
        visit = self._visit("lista_para_doctor")

        payload = start_consultation(visit.id_visit, ["doctor"])

        self.assertEqual(payload["id"], visit.id_visit)
        self.assertEqual(payload["status"], "en_consulta")
        visit.refresh_from_db()
        self.assertEqual(visit.status, "en_consulta")

    def test_start_consultation_role_not_allowed(self):
        visit = self._visit("lista_para_doctor")

        with self.assertRaises(VisitDomainError) as raised:
            start_consultation(visit.id_visit, ["recepcion"])

        self.assertEqual(raised.exception.code, "ROLE_NOT_ALLOWED")
        self.assertEqual(raised.exception.status_code, 403)

    def test_start_consultation_allows_clinico_permission_dependency(self):
        visit = self._visit("lista_para_doctor")

        payload = start_consultation(
            visit.id_visit,
            ["CLINICO"],
            ["clinico:consultas:read"],
        )

        self.assertEqual(payload["status"], "en_consulta")

    def test_start_consultation_invalid_transition(self):
        visit = self._visit("en_espera")

        with self.assertRaises(VisitDomainError) as raised:
            start_consultation(visit.id_visit, ["DOCTOR"])

        self.assertEqual(raised.exception.code, "VISIT_STATE_INVALID")
        self.assertEqual(raised.exception.status_code, 409)

    def test_close_consultation_happy_path_and_persists_record(self):
        visit = self._visit("en_consulta")

        payload = close_consultation(
            visit_id=visit.id_visit,
            roles=["DOCTOR"],
            primary_diagnosis="Hipertension arterial",
            final_note="Paciente estable y con tratamiento inicial.",
            doctor_id=101,
        )

        self.assertEqual(payload["visit"]["status"], "cerrada")
        self.assertEqual(payload["consultation"]["visitId"], visit.id_visit)
        self.assertEqual(payload["consultation"]["doctorId"], 101)
        self.assertEqual(payload["consultation"]["primaryDiagnosis"], "Hipertension arterial")

        visit.refresh_from_db()
        self.assertEqual(visit.status, "cerrada")

        consultation = VisitConsultation.objects.get(id_visit=visit)
        self.assertEqual(consultation.final_note, "Paciente estable y con tratamiento inicial.")

    def test_close_consultation_allows_clinico_permission_dependency(self):
        visit = self._visit("en_consulta")

        payload = close_consultation(
            visit_id=visit.id_visit,
            roles=["CLINICO"],
            primary_diagnosis="Cefalea tensional",
            final_note="Paciente con manejo sintomatico.",
            doctor_id=101,
            permissions=["clinico:consultas:read"],
        )

        self.assertEqual(payload["visit"]["status"], "cerrada")

    def test_close_consultation_requires_required_fields_by_guard_clause(self):
        visit = self._visit("en_consulta")

        with self.assertRaises(VisitDomainError) as raised:
            close_consultation(
                visit_id=visit.id_visit,
                roles=["DOCTOR"],
                primary_diagnosis="  ",
                final_note="",
                doctor_id=101,
            )

        self.assertEqual(raised.exception.code, "VISIT_STATE_INVALID")
        self.assertEqual(raised.exception.status_code, 409)

    def test_close_consultation_upserts_same_visit_record(self):
        visit = self._visit("en_consulta")
        close_consultation(
            visit.id_visit,
            ["DOCTOR"],
            "Dx inicial",
            "Nota inicial",
            101,
        )

        visit.status = "en_consulta"
        visit.save(update_fields=["status", "fch_modf"])

        close_consultation(
            visit.id_visit,
            ["DOCTOR"],
            "Dx final",
            "Nota final",
            202,
        )

        self.assertEqual(VisitConsultation.objects.filter(id_visit=visit).count(), 1)
        consultation = VisitConsultation.objects.get(id_visit=visit)
        self.assertEqual(consultation.doctor_id, 202)
        self.assertEqual(consultation.primary_diagnosis, "Dx final")
