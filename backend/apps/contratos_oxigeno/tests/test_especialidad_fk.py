"""Cubre el fix de especialidad (CharField libre -> ForeignKey real a
catalogos.Especialidades, ver migracion 0006_especialidad_fk_integrity).
A diferencia de sucursal, especialidad es opcional -- el frontend ahora usa
un combobox limpiable (CatalogCombobox) que manda "" al deseleccionar, y
eso tiene que resolver a None, no a un error de "catalogo no existe"."""

from django.db.models import ProtectedError
from django.test import TestCase

from apps.catalogos.models import Especialidades
from apps.contratos_oxigeno.models import ContratoOxigeno
from apps.contratos_oxigeno.serializers import ContratoOxigenoSerializer
from apps.contratos_oxigeno.tests.test_sucursal_fk import _contrato_kwargs
from apps.catalogos.models import CatSucursal


class EspecialidadSerializerTests(TestCase):
    def setUp(self):
        self.sucursal = CatSucursal.objects.create(name="MATRIZ")
        self.cardiologia = Especialidades.objects.create(name="Cardiologia")
        self.pediatria = Especialidades.objects.create(name="Pediatria")

    def test_especialidad_defaults_to_none_when_not_set(self):
        contrato = ContratoOxigeno.objects.create(**_contrato_kwargs(self.sucursal))

        data = ContratoOxigenoSerializer(contrato).data

        self.assertIsNone(data["especialidad"])

    def test_read_returns_especialidad_name_not_id(self):
        contrato = ContratoOxigeno.objects.create(
            **_contrato_kwargs(self.sucursal, especialidad=self.cardiologia)
        )

        data = ContratoOxigenoSerializer(contrato).data

        self.assertEqual(data["especialidad"], "Cardiologia")

    def test_write_with_valid_especialidad_name_resolves_fk(self):
        contrato = ContratoOxigeno.objects.create(**_contrato_kwargs(self.sucursal))

        serializer = ContratoOxigenoSerializer(
            contrato, data={"especialidad": "Pediatria"}, partial=True
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.especialidad_id, self.pediatria.id)

    def test_write_with_invalid_especialidad_name_is_rejected(self):
        contrato = ContratoOxigeno.objects.create(**_contrato_kwargs(self.sucursal))

        serializer = ContratoOxigenoSerializer(
            contrato, data={"especialidad": "NO_EXISTE"}, partial=True
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("especialidad", serializer.errors)

    def test_clearing_especialidad_with_empty_string_sets_none(self):
        contrato = ContratoOxigeno.objects.create(
            **_contrato_kwargs(self.sucursal, especialidad=self.cardiologia)
        )

        serializer = ContratoOxigenoSerializer(contrato, data={"especialidad": ""}, partial=True)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertIsNone(updated.especialidad_id)

    def test_cannot_delete_especialidad_referenced_by_contrato(self):
        ContratoOxigeno.objects.create(
            **_contrato_kwargs(self.sucursal, especialidad=self.cardiologia)
        )

        with self.assertRaises(ProtectedError):
            self.cardiologia.delete()
