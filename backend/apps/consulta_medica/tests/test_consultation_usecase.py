from django.test import TestCase

from apps.catalogos.models import CatCies
from apps.consulta_medica.models import VisitConsultation
from apps.consulta_medica.uses_case.consultation_usecase import (
    close_consultation,
    save_diagnosis,
    save_prescriptions,
    search_cies,
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

    def test_save_diagnosis_happy_path_persists_without_closing_visit(self):
        visit = self._visit("en_consulta")

        payload = save_diagnosis(
            visit_id=visit.id_visit,
            roles=["DOCTOR"],
            primary_diagnosis="Faringitis aguda",
            final_note="Paciente estable.",
            doctor_id=101,
        )

        self.assertEqual(payload["visitId"], visit.id_visit)
        self.assertEqual(payload["status"], "en_consulta")
        self.assertEqual(payload["primaryDiagnosis"], "Faringitis aguda")
        self.assertIsNone(payload["cieCode"])

        visit.refresh_from_db()
        self.assertEqual(visit.status, "en_consulta")

        consultation = VisitConsultation.objects.get(id_visit=visit)
        self.assertEqual(consultation.primary_diagnosis, "Faringitis aguda")
        self.assertEqual(consultation.final_note, "Paciente estable.")

    def test_save_diagnosis_with_cie_code_persists_selection(self):
        visit = self._visit("en_consulta")
        CatCies.objects.create(
            code="A090",
            description="GASTROENTERITIS",
            version="CIE-10",
            is_active=True,
        )

        payload = save_diagnosis(
            visit_id=visit.id_visit,
            roles=["DOCTOR"],
            primary_diagnosis="Gastroenteritis aguda",
            final_note="Paciente estable.",
            doctor_id=101,
            cie_code="a090",
        )

        self.assertEqual(payload["cieCode"], "A090")

        consultation = VisitConsultation.objects.get(id_visit=visit)
        self.assertEqual(consultation.cie_code, "A090")

    def test_save_diagnosis_invalid_cie_code_raises_validation_error(self):
        visit = self._visit("en_consulta")

        with self.assertRaises(VisitDomainError) as raised:
            save_diagnosis(
                visit_id=visit.id_visit,
                roles=["DOCTOR"],
                primary_diagnosis="Dx",
                final_note="Nota",
                doctor_id=101,
                cie_code="ZZ999",
            )

        self.assertEqual(raised.exception.code, "VALIDATION_ERROR")
        self.assertEqual(raised.exception.status_code, 422)

    def test_search_cies_matches_code_without_special_characters(self):
        CatCies.objects.create(
            code="1A33.0",
            description="CISTOISOSPORIASIS DEL INTESTINO DELGADO",
            version="CIE-10",
            is_active=True,
        )

        payload = search_cies("1A330", roles=["DOCTOR"])
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["items"][0]["code"], "1A33.0")

    def test_save_diagnosis_invalid_state_raises_visit_state_invalid(self):
        visit = self._visit("lista_para_doctor")

        with self.assertRaises(VisitDomainError) as raised:
            save_diagnosis(
                visit_id=visit.id_visit,
                roles=["DOCTOR"],
                primary_diagnosis="Dx",
                final_note="Nota",
                doctor_id=101,
            )

        self.assertEqual(raised.exception.code, "VISIT_STATE_INVALID")
        self.assertEqual(raised.exception.status_code, 409)

    def test_save_prescriptions_happy_path(self):
        visit = self._visit("en_consulta")

        payload = save_prescriptions(
            visit_id=visit.id_visit,
            roles=["DOCTOR"],
            items=["Paracetamol 500mg", "Reposo domiciliario"],
            doctor_id=101,
        )

        self.assertEqual(payload["visitId"], visit.id_visit)
        self.assertEqual(payload["status"], "en_consulta")
        self.assertEqual(
            payload["items"],
            ["Paracetamol 500mg", "Reposo domiciliario"],
        )

    def test_close_consultation_is_idempotent_for_same_payload(self):
        visit = self._visit("en_consulta")

        first_payload = close_consultation(
            visit_id=visit.id_visit,
            roles=["DOCTOR"],
            primary_diagnosis="Dx estable",
            final_note="Nota estable",
            doctor_id=101,
        )

        second_payload = close_consultation(
            visit_id=visit.id_visit,
            roles=["DOCTOR"],
            primary_diagnosis="Dx estable",
            final_note="Nota estable",
            doctor_id=101,
        )

        self.assertEqual(first_payload["visit"]["status"], "cerrada")
        self.assertEqual(second_payload["visit"]["status"], "cerrada")
        self.assertEqual(
            second_payload["consultation"]["primaryDiagnosis"],
            "Dx estable",
        )
