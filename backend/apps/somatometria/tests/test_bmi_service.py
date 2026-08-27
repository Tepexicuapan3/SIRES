"""
Tests unitarios de `bmi_service.calculate_bmi` (Fase 2, task 2.9 del
change somatometria-modulo-integral). Valida la extraccion del calculo
(design D9): el mismo input debe producir SIEMPRE el mismo `Decimal`,
sin importar si lo invoca la captura (POST) o -- a futuro -- la edicion
auditada (PATCH, Fase 3). Un solo lugar, cero divergencia de
formula/redondeo entre los dos caminos.
"""
from decimal import Decimal

from django.test import SimpleTestCase

from apps.somatometria.services.bmi_service import calculate_bmi
from apps.somatometria.uses_case.capture_vitals_usecase import _calculate_bmi


class CalculateBmiTests(SimpleTestCase):
    def test_same_input_returns_same_decimal(self):
        first = calculate_bmi(70, 175)
        second = calculate_bmi(70, 175)

        self.assertEqual(first, second)
        self.assertEqual(first, Decimal("22.86"))

    def test_rounds_half_up_to_two_decimals(self):
        # 70 / 1.70^2 = 24.2214532... -> redondea a 24.22
        self.assertEqual(calculate_bmi(70, 170), Decimal("24.22"))

    def test_usecase_alias_delegates_to_shared_service(self):
        # D9: `capture_vitals_usecase._calculate_bmi` es un re-export del
        # mismo `calculate_bmi` -- nunca una copia con formula propia.
        self.assertIs(_calculate_bmi, calculate_bmi)
        self.assertEqual(_calculate_bmi(70, 175), calculate_bmi(70, 175))
