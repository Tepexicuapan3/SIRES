"""
Tests de ``services.consultorios_service``: ``listar_consultorios_en_linea``
y ``listar_centros_en_linea``.

Cubre: (1) consultorio con franja LINEA/AMBOS aparece, (2) consultorio
solo PRESENCIAL o con ``RelMedicoConsultorio.is_active=False`` queda
excluido, (3) consultorio ``is_active=False`` queda excluido, (4) no se
duplica por médico/franja repetida (``.distinct()``), (5) el resultado se
sirve desde cache dentro del TTL, (6) filtro por ``centro_id`` en memoria
sobre la lista cacheada, (7) catálogo de centros deduplicado desde esa
misma lista (portal-citas-filtro-clinica).
"""

from datetime import date

from django.core.cache import cache
from django.test import TestCase

from apps.authentication.models import DetUsuario, SyUsuario
from apps.catalogos.models import CatCentroAtencion, Consultorios, Turnos
from apps.medicos.models import CatMedico, RelMedicoConsultorio, RelMedicoConsultorioHorario
from apps.portal_citas.services.consultorios_service import (
    listar_centros_en_linea,
    listar_consultorios_en_linea,
)


class ListarConsultoriosEnLineaTests(TestCase):
    def setUp(self):
        cache.clear()

        self.centro = CatCentroAtencion.objects.create(
            name="Centro Test",
            code="CT-CONS-01",
            center_type=CatCentroAtencion.TipoCentro.CLINICA,
            is_active=True,
        )
        self.turno = Turnos.objects.create(name="Matutino", is_active=True)

        usuario = SyUsuario.objects.create(
            usuario="medico.consultorios",
            correo="medico.consultorios@example.com",
            clave_hash="x",
            est_activo=True,
        )
        DetUsuario.objects.create(
            id_usuario=usuario,
            nombre="Ana",
            paterno="Ruiz",
            nombre_completo="Ana Ruiz",
        )
        self.medico = CatMedico.objects.create(id_usuario=usuario)

    def _crear_consultorio(self, numero, is_active=True):
        return Consultorios.objects.create(
            name=f"Consultorio {numero}",
            numero=numero,
            id_turn=self.turno,
            id_center=self.centro,
            is_active=is_active,
        )

    def _asignar_franja(self, consultorio, canal, rel_activa=True):
        rel = RelMedicoConsultorio.objects.create(
            medico=self.medico,
            consultorio=consultorio,
            fecha_inicio=date(2026, 1, 1),
            is_active=rel_activa,
        )
        RelMedicoConsultorioHorario.objects.create(
            rel_medico_consultorio=rel,
            dia_semana="LUNES",
            hora_inicio="08:00",
            hora_fin="12:00",
            canal=canal,
        )
        return rel

    def test_consultorio_con_franja_linea_aparece(self):
        consultorio = self._crear_consultorio(1)
        self._asignar_franja(consultorio, "LINEA")

        resultado = listar_consultorios_en_linea()

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["consultorioId"], consultorio.id)
        self.assertEqual(resultado[0]["nombre"], consultorio.name)
        self.assertEqual(resultado[0]["numero"], 1)
        self.assertEqual(resultado[0]["centroNombre"], self.centro.name)

    def test_consultorio_con_franja_ambos_aparece(self):
        consultorio = self._crear_consultorio(2)
        self._asignar_franja(consultorio, "AMBOS")

        resultado = listar_consultorios_en_linea()

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["consultorioId"], consultorio.id)

    def test_consultorio_solo_presencial_excluido(self):
        consultorio = self._crear_consultorio(3)
        self._asignar_franja(consultorio, "PRESENCIAL")

        self.assertEqual(listar_consultorios_en_linea(), [])

    def test_consultorio_inactivo_excluido_aunque_tenga_franja_en_linea(self):
        consultorio = self._crear_consultorio(4, is_active=False)
        self._asignar_franja(consultorio, "AMBOS")

        self.assertEqual(listar_consultorios_en_linea(), [])

    def test_asignacion_medico_consultorio_inactiva_excluye_el_consultorio(self):
        consultorio = self._crear_consultorio(5)
        self._asignar_franja(consultorio, "LINEA", rel_activa=False)

        self.assertEqual(listar_consultorios_en_linea(), [])

    def test_no_duplica_por_multiples_franjas_del_mismo_consultorio(self):
        consultorio = self._crear_consultorio(6)
        rel = RelMedicoConsultorio.objects.create(
            medico=self.medico,
            consultorio=consultorio,
            fecha_inicio=date(2026, 1, 1),
            is_active=True,
        )
        RelMedicoConsultorioHorario.objects.create(
            rel_medico_consultorio=rel,
            dia_semana="LUNES",
            hora_inicio="08:00",
            hora_fin="12:00",
            canal="LINEA",
        )
        RelMedicoConsultorioHorario.objects.create(
            rel_medico_consultorio=rel,
            dia_semana="MARTES",
            hora_inicio="08:00",
            hora_fin="12:00",
            canal="AMBOS",
        )

        resultado = listar_consultorios_en_linea()

        self.assertEqual(len(resultado), 1)

    def test_resultado_se_sirve_desde_cache_dentro_del_ttl(self):
        consultorio = self._crear_consultorio(7)
        self._asignar_franja(consultorio, "LINEA")

        primero = listar_consultorios_en_linea()

        # Se habilita OTRO consultorio después de la primera lectura sin
        # invalidar la cache: si `listar_consultorios_en_linea` estuviera
        # yendo a la BD en cada llamada, el segundo resultado lo vería.
        otro = self._crear_consultorio(8)
        self._asignar_franja(otro, "LINEA")

        segundo = listar_consultorios_en_linea()

        self.assertEqual(primero, segundo)
        self.assertEqual(len(segundo), 1)


class ListarConsultoriosEnLineaFiltroCentroTests(TestCase):
    """``listar_consultorios_en_linea(centro_id=...)`` — filtro en memoria
    sobre la lista cacheada (REQ-2)."""

    def setUp(self):
        cache.clear()

        self.centro_a = CatCentroAtencion.objects.create(
            name="Centro Filtro A",
            code="CT-FILT-A",
            center_type=CatCentroAtencion.TipoCentro.CLINICA,
            is_active=True,
        )
        self.centro_b = CatCentroAtencion.objects.create(
            name="Centro Filtro B",
            code="CT-FILT-B",
            center_type=CatCentroAtencion.TipoCentro.CLINICA,
            is_active=True,
        )
        self.turno = Turnos.objects.create(name="Matutino", is_active=True)

        usuario = SyUsuario.objects.create(
            usuario="medico.filtro",
            correo="medico.filtro@example.com",
            clave_hash="x",
            est_activo=True,
        )
        DetUsuario.objects.create(
            id_usuario=usuario,
            nombre="Luis",
            paterno="Diaz",
            nombre_completo="Luis Diaz",
        )
        self.medico = CatMedico.objects.create(id_usuario=usuario)

        self.consultorio_a = Consultorios.objects.create(
            name="Consultorio A", numero=1, id_turn=self.turno,
            id_center=self.centro_a, is_active=True,
        )
        self.consultorio_b = Consultorios.objects.create(
            name="Consultorio B", numero=2, id_turn=self.turno,
            id_center=self.centro_b, is_active=True,
        )
        for consultorio in (self.consultorio_a, self.consultorio_b):
            rel = RelMedicoConsultorio.objects.create(
                medico=self.medico, consultorio=consultorio,
                fecha_inicio=date(2026, 1, 1), is_active=True,
            )
            RelMedicoConsultorioHorario.objects.create(
                rel_medico_consultorio=rel, dia_semana="LUNES",
                hora_inicio="08:00", hora_fin="12:00", canal="LINEA",
            )

    def test_filtra_por_centro_id(self):
        resultado = listar_consultorios_en_linea(centro_id=self.centro_a.id)

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["consultorioId"], self.consultorio_a.id)

    def test_sin_centro_id_devuelve_todo(self):
        resultado = listar_consultorios_en_linea()

        self.assertEqual(
            {c["consultorioId"] for c in resultado},
            {self.consultorio_a.id, self.consultorio_b.id},
        )

    def test_centro_id_inexistente_devuelve_lista_vacia(self):
        resultado = listar_consultorios_en_linea(centro_id=999999)

        self.assertEqual(resultado, [])


class ListarCentrosEnLineaTests(TestCase):
    """``listar_centros_en_linea`` — catálogo de centros dedup por
    ``centroId`` sobre la lista cacheada de consultorios online (REQ-1)."""

    def setUp(self):
        cache.clear()

        self.centro_zeta = CatCentroAtencion.objects.create(
            name="Centro Zeta",
            code="CT-CENT-Z",
            center_type=CatCentroAtencion.TipoCentro.CLINICA,
            is_active=True,
        )
        self.centro_alfa_hospital = CatCentroAtencion.objects.create(
            name="Centro Alfa",
            code="CT-CENT-A",
            center_type=CatCentroAtencion.TipoCentro.HOSPITAL,
            is_active=True,
        )
        self.centro_sin_online = CatCentroAtencion.objects.create(
            name="Centro Sin Online",
            code="CT-CENT-S",
            center_type=CatCentroAtencion.TipoCentro.CLINICA,
            is_active=True,
        )
        self.turno = Turnos.objects.create(name="Matutino", is_active=True)

        usuario = SyUsuario.objects.create(
            usuario="medico.centros",
            correo="medico.centros@example.com",
            clave_hash="x",
            est_activo=True,
        )
        DetUsuario.objects.create(
            id_usuario=usuario,
            nombre="Ana",
            paterno="Ruiz",
            nombre_completo="Ana Ruiz",
        )
        self.medico = CatMedico.objects.create(id_usuario=usuario)

    def _crear_consultorio(self, numero, centro):
        return Consultorios.objects.create(
            name=f"Consultorio {numero}", numero=numero, id_turn=self.turno,
            id_center=centro, is_active=True,
        )

    def _asignar_franja(self, consultorio, canal):
        rel = RelMedicoConsultorio.objects.create(
            medico=self.medico, consultorio=consultorio,
            fecha_inicio=date(2026, 1, 1), is_active=True,
        )
        RelMedicoConsultorioHorario.objects.create(
            rel_medico_consultorio=rel, dia_semana="LUNES",
            hora_inicio="08:00", hora_fin="12:00", canal=canal,
        )

    def test_centro_sin_consultorios_online_se_excluye(self):
        c1 = self._crear_consultorio(1, self.centro_zeta)
        self._asignar_franja(c1, "LINEA")
        c2 = self._crear_consultorio(2, self.centro_sin_online)
        self._asignar_franja(c2, "PRESENCIAL")

        resultado = listar_centros_en_linea()

        self.assertEqual([c["centroId"] for c in resultado], [self.centro_zeta.id])

    def test_dedup_por_centro_con_dos_consultorios(self):
        c1 = self._crear_consultorio(1, self.centro_zeta)
        self._asignar_franja(c1, "LINEA")
        c2 = self._crear_consultorio(2, self.centro_zeta)
        self._asignar_franja(c2, "AMBOS")

        resultado = listar_centros_en_linea()

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["centroId"], self.centro_zeta.id)

    def test_orden_por_nombre(self):
        c1 = self._crear_consultorio(1, self.centro_zeta)  # "Centro Zeta"
        self._asignar_franja(c1, "LINEA")
        c2 = self._crear_consultorio(2, self.centro_alfa_hospital)  # "Centro Alfa"
        self._asignar_franja(c2, "LINEA")

        resultado = listar_centros_en_linea()

        self.assertEqual([c["nombre"] for c in resultado], ["Centro Alfa", "Centro Zeta"])

    def test_hospital_se_lista_igual_que_clinica(self):
        c1 = self._crear_consultorio(1, self.centro_alfa_hospital)
        self._asignar_franja(c1, "LINEA")

        resultado = listar_centros_en_linea()

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["centroId"], self.centro_alfa_hospital.id)
