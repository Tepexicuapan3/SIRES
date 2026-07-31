"""
apps/portal_citas/services/pdf_comprobante_service.py
=========================================================
Generación del PDF del comprobante de cita reservada desde el portal
(Fase 5), con el código QR de check-in embebido.

Se usa ``reportlab`` (Python puro) en vez de Word/``docxtpl``/``docx2pdf``
que ya usa ``apps.recepcion.services.ficha_service`` -- ese servicio
depende de Word instalado localmente vía ``pythoncom``, lo cual solo
corre en Windows con Office instalado. Este comprobante se genera desde
una tarea de Celery que corre en el contenedor ``celery-worker`` (Linux),
así que necesita una librería sin dependencias de sistema (nada de
Word/Pango/Cairo) -- ``reportlab`` dibuja el PDF directamente en Python
puro y es portable en un contenedor Linux sin instalar nada más.
"""

import io

from django.conf import settings

from apps.portal_citas.services.comprobante_service import (
    construir_payload_qr,
    generar_qr_png,
)


def generar_pdf_comprobante(cita, miembro_objetivo) -> bytes:
    """
    Genera el PDF del comprobante en memoria y devuelve sus bytes.

    ``cita``: instancia de ``apps.recepcion.models.CitaMedica`` ya
    reservada, con ``medico__id_usuario__detalle`` y ``consultorio``
    precargados (select_related) para no disparar queries extra acá.
    ``miembro_objetivo``: ``PortalMiembro`` del paciente de la cita --
    se imprime su ``nombre_visible``, nunca ``no_exp``/``pk_num`` (dato
    interno de identificación que no debe quedar impreso en un
    comprobante que el paciente se lleva).
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import mm
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 25 * mm

    logo_path = getattr(settings, "CITAS_LOGO_PATH", None)
    if logo_path and logo_path.exists():
        try:
            c.drawImage(
                str(logo_path),
                20 * mm,
                y - 15 * mm,
                width=25 * mm,
                height=25 * mm,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception:
            # El logo es cosmético: nunca debe romper la generación del PDF.
            pass

    c.setFont("Helvetica-Bold", 16)
    c.drawString(55 * mm, y, "Comprobante de cita médica")
    y -= 20 * mm

    det_medico = getattr(cita.medico.id_usuario, "detalle", None)
    nombre_medico = (
        det_medico.nombre_completo if det_medico else cita.medico.id_usuario.usuario
    )

    campos = [
        ("Folio", cita.folio),
        ("Paciente", miembro_objetivo.nombre_visible),
        ("Fecha", cita.fecha_hora.strftime("%d/%m/%Y")),
        ("Hora", cita.fecha_hora.strftime("%H:%M")),
        ("Consultorio", cita.consultorio.name if cita.consultorio else "Por asignar"),
        ("Médico", f"Dr(a). {nombre_medico}"),
        ("Tipo de servicio", cita.get_servicio_tipo_display()),
    ]

    for etiqueta, valor in campos:
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20 * mm, y, f"{etiqueta}:")
        c.setFont("Helvetica", 11)
        c.drawString(65 * mm, y, str(valor))
        y -= 8 * mm

    payload = construir_payload_qr(cita.folio)
    qr_png = generar_qr_png(payload)
    qr_reader = ImageReader(io.BytesIO(qr_png))
    qr_size = 45 * mm
    y -= 5 * mm
    c.drawImage(
        qr_reader,
        (width - qr_size) / 2,
        y - qr_size,
        width=qr_size,
        height=qr_size,
    )

    y -= qr_size + 10 * mm
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(
        width / 2,
        y,
        "Presenta este código QR en recepción el día de tu cita para el check-in.",
    )

    c.showPage()
    c.save()
    return buffer.getvalue()
