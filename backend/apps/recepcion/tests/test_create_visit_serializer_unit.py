from django.test import TestCase

from apps.catalogos.models import TipoDeCitas
from apps.recepcion.serializers import CreateVisitSerializer


class CreateVisitSerializerTipoCitaValidationTests(TestCase):
    """
    Unit tests de `validate_tipoCitaId` (tasks 2.2/2.3): se valida
    EXISTENCIA de la fila en `cat_tpcitas`, nunca el flag `is_active` --
    ver Decision 2 del design de `tipo-cita-visita`.
    """

    def _base_payload(self, **overrides):
        payload = {
            "noExp": "EXP9001",
            "pkNum": 0,
            "arrivalType": "walk_in",
        }
        payload.update(overrides)
        return payload

    def test_tipo_cita_id_inexistente_lanza_validation_error(self):
        serializer = CreateVisitSerializer(
            data=self._base_payload(tipoCitaId=999999)
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("tipoCitaId", serializer.errors)

    def test_tipo_cita_id_soft_deleted_pasa_la_validacion(self):
        tipo_cita = TipoDeCitas.objects.create(name="Consulta general")
        tipo_cita.is_active = False
        tipo_cita.save(update_fields=["is_active"])

        serializer = CreateVisitSerializer(
            data=self._base_payload(tipoCitaId=tipo_cita.id)
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["tipoCitaId"], tipo_cita.id)
        self.assertIsInstance(serializer.validated_data["tipoCitaId"], int)

    def test_tipo_cita_id_ausente_es_valido(self):
        serializer = CreateVisitSerializer(data=self._base_payload())

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn("tipoCitaId", serializer.validated_data)

    def test_tipo_cita_id_activo_pasa_la_validacion(self):
        tipo_cita = TipoDeCitas.objects.create(name="Especialidad")

        serializer = CreateVisitSerializer(
            data=self._base_payload(tipoCitaId=tipo_cita.id)
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["tipoCitaId"], tipo_cita.id)
        self.assertIsInstance(serializer.validated_data["tipoCitaId"], int)
