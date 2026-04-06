"""
apps/recepcion/usecases/citas_usecase.py
========================================
Orquestador del flujo de agendamiento.

La view llama al use case; el use case llama al repository y al service.
Aquí vive la lógica de negocio de vigencia del paciente.
"""

import logging
from typing import Optional

from ..repositories.paciente_repository import PacienteRepository, PacienteDTO
from ..repositories.citas_repository import CitasRepository
from ..services.notificacion_service import NotificacionCitaService
from ..models import CitaMedica, TipoPaciente

logger = logging.getLogger(__name__)


class CitasMedicaUseCase:
    def __init__(
        self,
        paciente_repo: Optional[PacienteRepository] = None,
        citas_repo: Optional[CitasRepository] = None,
        notif_service: Optional[NotificacionCitaService] = None,
    ):
        self.paciente_repo = paciente_repo or PacienteRepository()
        self.citas_repo = citas_repo or CitasRepository()
        self.notif_service = notif_service or NotificacionCitaService()

    # =========================================================================
    # CREAR CITA
    # =========================================================================

    def crear_cita(self, datos: dict, usuario_id: Optional[int] = None) -> CitaMedica:
        """
        Flujo:
        1. Resuelve el paciente desde expedientes.
        2. Valida vigencia.
        3. Delega creación al repository.
        4. Intenta enviar notificación sin revertir la cita si falla el correo.
        """
        paciente = self._resolver_paciente(datos)
        if not paciente:
            raise ValueError("Paciente no encontrado.")

        if not paciente["vigente"]:
            raise ValueError("El paciente no tiene vigencia activa en el servicio médico.")

        payload = dict(datos)
        payload["nombre_paciente"] = paciente["nombre_completo"]
        payload["creado_por"] = usuario_id
        payload["pk_num"] = int(payload.get("pk_num", 0))

        cita = self.citas_repo.crear_cita(payload)

        email = str(payload.get("email_notificacion", "") or "").strip()
        if email:
            try:
                self.notif_service.enviar_confirmacion_agendamiento(cita, email)
            except Exception as exc:
                logger.warning(
                    "No se pudo enviar notificación de confirmación para cita %s: %s",
                    cita.id,
                    exc,
                )

        return cita

    # =========================================================================
    # CANCELAR CITA
    # =========================================================================

    def cancelar_cita(
        self,
        cita_id,
        motivo: str = "",
        enviar_correo: bool = True,
    ) -> CitaMedica:
        cita = self.citas_repo.cancelar_cita(cita_id, motivo=motivo)

        if enviar_correo:
            notif_orig = (
                cita.notificaciones.filter(
                    tipo="confirmacion",
                    enviado=True,
                )
                .order_by("-created_at")
                .first()
            )

            if notif_orig and notif_orig.email_destino:
                try:
                    self.notif_service.enviar_cancelacion(
                        cita,
                        notif_orig.email_destino,
                    )
                except Exception as exc:
                    logger.warning(
                        "No se pudo enviar cancelación para cita %s: %s",
                        cita.id,
                        exc,
                    )

        return cita

    # =========================================================================
    # CONFIRMAR DESDE TOKEN
    # =========================================================================

    def confirmar_desde_token(self, cita_id) -> CitaMedica:
        return self.citas_repo.confirmar_cita(cita_id)

    # =========================================================================
    # HELPER INTERNO
    # =========================================================================

    def _resolver_paciente(self, datos: dict) -> Optional[PacienteDTO]:
        no_exp = int(datos["no_exp"])
        pk_num = int(datos.get("pk_num", 0))
        tipo_paciente = datos["tipo_paciente"]

        # soporta tanto el enum como el valor string
        if tipo_paciente in (TipoPaciente.TRABAJADOR, TipoPaciente.TRABAJADOR.value):
            return self.paciente_repo.get_trabajador(no_exp)

        if tipo_paciente in (
            TipoPaciente.DERECHOHABIENTE,
            TipoPaciente.DERECHOHABIENTE.value,
        ):
            return self.paciente_repo.get_paciente(no_exp=no_exp, pk_num=pk_num)

        raise ValueError("Tipo de paciente inválido.")