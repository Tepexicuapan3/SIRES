"""
apps/recepcion/services/notificacion_service.py
================================================
Envío de correos de cita (confirmación, recordatorio, cancelación).
Usa la configuración SMTP existente en settings.py.
"""

import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from ..models import CitaMedica, CitaNotificacion
from .pdf_service import generar_pdf_cita

logger = logging.getLogger(__name__)

TOKEN_TTL_HORAS = 72


class NotificacionCitaService:
    def __init__(self):
        self.base_url = str(
            getattr(settings, "CITAS_BASE_URL", "http://localhost:8000")
        ).rstrip("/")
        self.logo_path = getattr(settings, "CITAS_LOGO_PATH", None)

    # =========================================================================
    # CONFIRMACIÓN AL AGENDAR
    # =========================================================================

    def enviar_confirmacion_agendamiento(
        self,
        cita: CitaMedica,
        email: str,
    ) -> CitaNotificacion:
        notif = CitaNotificacion.objects.create(
            cita=cita,
            tipo=CitaNotificacion.TipoNotif.CONFIRMACION,
            email_destino=email,
            token_expira=timezone.now() + timedelta(hours=TOKEN_TTL_HORAS),
        )

        url_confirmar = self._build_accion_url(notif.token, "confirmar")
        url_cancelar = self._build_accion_url(notif.token, "cancelar")

        cita_data = self._cita_dict(cita, token_url=url_confirmar)
        cita_data["token_url_cancelar"] = url_cancelar

        try:
            pdf = generar_pdf_cita(cita_data, logo_path=self.logo_path)

            context = {
                "cita": cita_data,
                "base_url": self.base_url,
            }
            html = render_to_string("recepcion/email_confirmacion.html", context)
            text = self._build_text_confirmacion(cita_data)

            self._send(
                to=email,
                subject=f"Cita médica confirmada - {cita.fecha_hora.strftime('%d/%m/%Y %H:%M')}",
                text=text,
                html=html,
                pdf=pdf,
                pdf_name=f"cita_{str(cita.id)[:8]}.pdf",
            )

            notif.enviado = True
            notif.error = ""
            notif.save(update_fields=["enviado", "error"])

        except Exception as exc:
            logger.exception("Error enviando correo de confirmación para cita %s: %s", cita.id, exc)
            notif.enviado = False
            notif.error = str(exc)
            notif.save(update_fields=["enviado", "error"])

        return notif

    # =========================================================================
    # RECORDATORIO
    # =========================================================================

    def enviar_recordatorio(
        self,
        cita: CitaMedica,
        email: str,
    ) -> CitaNotificacion:
        notif = CitaNotificacion.objects.create(
            cita=cita,
            tipo=CitaNotificacion.TipoNotif.RECORDATORIO,
            email_destino=email,
            token_expira=timezone.now() + timedelta(hours=26),
        )

        url_confirmar = self._build_accion_url(notif.token, "confirmar")
        url_cancelar = self._build_accion_url(notif.token, "cancelar")

        cita_data = self._cita_dict(cita, token_url=url_confirmar)
        cita_data["token_url_cancelar"] = url_cancelar

        try:
            context = {
                "cita": cita_data,
                "base_url": self.base_url,
            }
            html = render_to_string("recepcion/email_recordatorio.html", context)
            text = self._build_text_recordatorio(cita_data)

            self._send(
                to=email,
                subject=f"Recordatorio de cita - {cita.fecha_hora.strftime('%d/%m/%Y %H:%M')}",
                text=text,
                html=html,
            )

            notif.enviado = True
            notif.error = ""
            notif.save(update_fields=["enviado", "error"])

        except Exception as exc:
            logger.exception("Error enviando recordatorio para cita %s: %s", cita.id, exc)
            notif.enviado = False
            notif.error = str(exc)
            notif.save(update_fields=["enviado", "error"])

        return notif

    # =========================================================================
    # CANCELACIÓN
    # =========================================================================

    def enviar_cancelacion(
        self,
        cita: CitaMedica,
        email: str,
    ) -> CitaNotificacion:
        notif = CitaNotificacion.objects.create(
            cita=cita,
            tipo=CitaNotificacion.TipoNotif.CANCELACION,
            email_destino=email,
        )

        cita_data = self._cita_dict(cita)

        try:
            context = {
                "cita": cita_data,
                "base_url": self.base_url,
            }
            html = render_to_string("recepcion/email_cancelacion.html", context)
            text = self._build_text_cancelacion(cita_data)

            self._send(
                to=email,
                subject=f"Cita médica cancelada - {cita.fecha_hora.strftime('%d/%m/%Y %H:%M')}",
                text=text,
                html=html,
            )

            notif.enviado = True
            notif.error = ""
            notif.save(update_fields=["enviado", "error"])

        except Exception as exc:
            logger.exception("Error enviando cancelación para cita %s: %s", cita.id, exc)
            notif.enviado = False
            notif.error = str(exc)
            notif.save(update_fields=["enviado", "error"])

        return notif

    # =========================================================================
    # HELPERS
    # =========================================================================

    def _build_accion_url(self, token, accion: str) -> str:
        """
        Alineado con tu urls.py:
        /api/v1/recepcion/accion/<uuid>/<accion>/
        """
        return f"{self.base_url}/api/v1/recepcion/accion/{token}/{accion}/"

    @staticmethod
    def _cita_dict(cita: CitaMedica, token_url: str = "") -> dict:
        return {
            "id": str(cita.id),
            "tipo_paciente": cita.tipo_paciente,
            "tipo_paciente_display": cita.get_tipo_paciente_display(),
            "no_exp": cita.no_exp,
            "pk_num": cita.pk_num,
            "nombre_paciente": cita.nombre_paciente,
            "nombre_medico": cita.nombre_medico,
            "nombre_centro": cita.nombre_centro,
            "nombre_consult": cita.nombre_consult,
            "fecha_hora": cita.fecha_hora.isoformat(),
            "estatus": cita.estatus,
            "estatus_display": cita.get_estatus_display(),
            "motivo": cita.motivo,
            "token_url": token_url,
        }

    @staticmethod
    def _send(
        to: str,
        subject: str,
        text: str,
        html: str,
        pdf: bytes | None = None,
        pdf_name: str = "cita.pdf",
    ) -> None:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to],
        )
        msg.attach_alternative(html, "text/html")

        if pdf:
            msg.attach(pdf_name, pdf, "application/pdf")

        msg.send(fail_silently=False)

    @staticmethod
    def _build_text_confirmacion(cita: dict) -> str:
        return (
            "Su cita médica ha sido registrada.\n\n"
            f"Paciente: {cita['nombre_paciente']}\n"
            f"Médico: {cita['nombre_medico']}\n"
            f"Centro: {cita['nombre_centro']}\n"
            f"Consultorio: {cita['nombre_consult']}\n"
            f"Fecha y hora: {cita['fecha_hora']}\n\n"
            f"Confirmar asistencia: {cita.get('token_url', '')}\n"
            f"Cancelar cita: {cita.get('token_url_cancelar', '')}\n"
        )

    @staticmethod
    def _build_text_recordatorio(cita: dict) -> str:
        return (
            "Le recordamos su cita médica.\n\n"
            f"Paciente: {cita['nombre_paciente']}\n"
            f"Médico: {cita['nombre_medico']}\n"
            f"Centro: {cita['nombre_centro']}\n"
            f"Consultorio: {cita['nombre_consult']}\n"
            f"Fecha y hora: {cita['fecha_hora']}\n\n"
            f"Confirmar asistencia: {cita.get('token_url', '')}\n"
            f"Cancelar cita: {cita.get('token_url_cancelar', '')}\n"
        )

    @staticmethod
    def _build_text_cancelacion(cita: dict) -> str:
        return (
            "Su cita médica ha sido cancelada.\n\n"
            f"Paciente: {cita['nombre_paciente']}\n"
            f"Médico: {cita['nombre_medico']}\n"
            f"Centro: {cita['nombre_centro']}\n"
            f"Consultorio: {cita['nombre_consult']}\n"
            f"Fecha y hora: {cita['fecha_hora']}\n"
        )