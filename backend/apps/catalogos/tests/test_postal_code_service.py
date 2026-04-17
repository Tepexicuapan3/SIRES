from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase

from catalogos.services.codigo_postal_service import CodigoPostalService
from catalogos.repositories.codigo_postal_repository import CodigoPostalRepository

TEST_FILE_CONTENT = (
    "d_codigo|d_asenta|d_tipo_asenta|D_mnpio|d_estado|d_ciudad|d_zona\n"
    "01000|San Ángel|Colonia|Álvaro Obregón|Ciudad de México|Ciudad de México|Urbano\n"
    "01000|Tlacopac|Colonia|Álvaro Obregón|Ciudad de México|Ciudad de México|Urbano\n"
    "06600|Juárez|Colonia|Cuauhtémoc|Ciudad de México|Ciudad de México|Urbano\n"
)


class CodigoPostalServiceTest(SimpleTestCase):

    def setUp(self):
        self.test_file = Path("/tmp/codigos_postales_test.txt")
        self.test_file.write_text(TEST_FILE_CONTENT, encoding="cp1252")

        # Instancia fresca por test → sin caché contaminado
        repository = CodigoPostalRepository.__new__(CodigoPostalRepository)
        with patch.object(CodigoPostalRepository, "_resolve_path", return_value=self.test_file):
            repository.__dict__  # inicializa el objeto
            _ = repository._index  # fuerza la carga del índice con el path correcto

        self.service = CodigoPostalService.__new__(CodigoPostalService)
        self.service.__dict__["_repository"] = repository

    def tearDown(self):
        self.test_file.unlink(missing_ok=True)

    # ------------------------------------------------------------------ #
    # Casos válidos                                                        #
    # ------------------------------------------------------------------ #

    def test_retorna_colonias_de_cp_existente(self):
        results = self.service.search("01000")
        self.assertEqual(len(results), 2)

    def test_datos_correctos_de_colonia(self):
        results = self.service.search("01000")
        primera = results[0]
        self.assertEqual(primera["colonia"],    "San Ángel")
        self.assertEqual(primera["municipio"],  "Álvaro Obregón")
        self.assertEqual(primera["estado"],     "Ciudad de México")
        self.assertEqual(primera["zona"],       "Urbano")

    def test_cp_con_multiples_colonias(self):
        results = self.service.search("01000")
        colonias = [r["colonia"] for r in results]
        self.assertIn("San Ángel", colonias)
        self.assertIn("Tlacopac", colonias)

    # ------------------------------------------------------------------ #
    # Casos inválidos                                                      #
    # ------------------------------------------------------------------ #

    def test_cp_inexistente_retorna_lista_vacia(self):
        self.assertEqual(self.service.search("99999"), [])

    def test_cp_con_letras_retorna_lista_vacia(self):
        self.assertEqual(self.service.search("ABC12"), [])

    def test_cp_vacio_retorna_lista_vacia(self):
        self.assertEqual(self.service.search(""), [])

    def test_cp_corto_retorna_lista_vacia(self):
        self.assertEqual(self.service.search("0100"), [])

    def test_cp_largo_retorna_lista_vacia(self):
        self.assertEqual(self.service.search("010000"), [])

    def test_cp_con_espacios_es_valido(self):
        """El servicio debe hacer strip antes de validar."""
        results = self.service.search("  01000  ")
        self.assertEqual(len(results), 2)