"""
apps/recepcion/services/pdf_service.py
======================================
Generación de PDF de confirmación de cita con ReportLab + QR.

Requiere:
    pip install reportlab "qrcode[pil]"
"""

import io
from datetime import datetime
from pathlib import Path
from typing import Optional

import qrcode
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    HRFlowable,
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


C_PRIMARIO = HexColor("#1a3a6b")
C_ACENTO = HexColor("#e84545")
C_FONDO = HexColor("#f5f7fa")
C_TEXTO = HexColor("#2d3748")
C_MUTED = HexColor("#718096")
C_LINEA = HexColor("#e2e8f0")


def generar_pdf_cita(cita_data: dict, logo_path: Optional[str] = None) -> bytes:
    """
    Genera un PDF de confirmación de cita.

    cita_data esperado:
    - id
    - tipo_paciente
    - tipo_paciente_display (opcional)
    - no_exp
    - pk_num
    - nombre_paciente
    - nombre_medico
    - nombre_centro
    - nombre_consult
    - fecha_hora (str ISO o datetime)
    - estatus
    - estatus_display (opcional)
    - motivo
    - token_url (opcional)
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Confirmación de Cita Médica",
    )

    # ---------------------------------------------------------------------
    # Estilos
    # ---------------------------------------------------------------------
    st_titulo = ParagraphStyle(
        "titulo",
        fontSize=20,
        fontName="Helvetica-Bold",
        textColor=C_PRIMARIO,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    st_sub = ParagraphStyle(
        "sub",
        fontSize=11,
        fontName="Helvetica",
        textColor=C_MUTED,
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    st_sec = ParagraphStyle(
        "sec",
        fontSize=10,
        fontName="Helvetica-Bold",
        textColor=C_PRIMARIO,
        spaceBefore=12,
        spaceAfter=4,
    )
    st_label = ParagraphStyle(
        "label",
        fontSize=10,
        fontName="Helvetica",
        textColor=C_MUTED,
    )
    st_valor = ParagraphStyle(
        "valor",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=C_TEXTO,
    )
    st_aviso = ParagraphStyle(
        "aviso",
        fontSize=9,
        fontName="Helvetica-Oblique",
        textColor=C_MUTED,
        alignment=TA_CENTER,
    )

    elems = []

    # ---------------------------------------------------------------------
    # Encabezado
    # ---------------------------------------------------------------------
    if logo_path:
        try:
            logo_path = str(Path(logo_path))
            logo = Image(logo_path, width=3.5 * cm, height=2 * cm, kind="proportional")
            hdata = [[
                logo,
                [
                    Paragraph("SISTEMA DE SALUD INSTITUCIONAL", st_sub),
                    Paragraph("CITA MÉDICA", st_titulo),
                    Paragraph("Comprobante de agendamiento", st_sub),
                ],
            ]]
            htable = Table(hdata, colWidths=[4 * cm, 13 * cm])
            htable.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ])
            )
            elems.append(htable)
        except Exception:
            elems.append(Paragraph("SISTEMA DE SALUD INSTITUCIONAL", st_sub))
            elems.append(Paragraph("CITA MÉDICA", st_titulo))
            elems.append(Paragraph("Comprobante de agendamiento", st_sub))
    else:
        elems.append(Paragraph("SISTEMA DE SALUD INSTITUCIONAL", st_sub))
        elems.append(Paragraph("CITA MÉDICA", st_titulo))
        elems.append(Paragraph("Comprobante de agendamiento", st_sub))

    elems.append(
        HRFlowable(
            width="100%",
            thickness=2,
            color=C_PRIMARIO,
            spaceAfter=12,
        )
    )

    # ---------------------------------------------------------------------
    # Datos del paciente
    # ---------------------------------------------------------------------
    tipo_label = (
        cita_data.get("tipo_paciente_display")
        or ("Trabajador" if cita_data.get("tipo_paciente") == "trabajador" else "Derechohabiente")
    )
    pk_num = cita_data.get("pk_num", 0)

    if cita_data.get("tipo_paciente") == "trabajador":
        id_label = f"Expediente: {cita_data.get('no_exp', '—')}"
    else:
        id_label = f"Expediente: {cita_data.get('no_exp', '—')} | ID: {pk_num}"

    elems.append(Paragraph("DATOS DEL PACIENTE", st_sec))
    pac_data = [
        [Paragraph("Nombre:", st_label), Paragraph(_safe(cita_data.get("nombre_paciente")), st_valor)],
        [Paragraph("Tipo:", st_label), Paragraph(_safe(tipo_label), st_valor)],
        [Paragraph("Identificación:", st_label), Paragraph(_safe(id_label), st_valor)],
    ]
    elems.append(_tabla_info(pac_data))

    # ---------------------------------------------------------------------
    # Datos de la cita
    # ---------------------------------------------------------------------
    elems.append(Paragraph("INFORMACIÓN DE LA CITA", st_sec))

    fh = _parse_fecha_hora(cita_data.get("fecha_hora"))
    fecha_str = _format_fecha_es(fh) if fh else "—"
    hora_str = fh.strftime("%H:%M hrs") if fh else "—"

    estatus_label = cita_data.get("estatus_display") or str(cita_data.get("estatus", "")).upper()

    cita_rows = [
        [Paragraph("Fecha:", st_label), Paragraph(fecha_str, st_valor)],
        [Paragraph("Hora:", st_label), Paragraph(hora_str, st_valor)],
        [Paragraph("Médico:", st_label), Paragraph(_safe(cita_data.get("nombre_medico")), st_valor)],
        [Paragraph("Centro:", st_label), Paragraph(_safe(cita_data.get("nombre_centro")), st_valor)],
        [Paragraph("Consultorio:", st_label), Paragraph(_safe(cita_data.get("nombre_consult")), st_valor)],
        [Paragraph("Estatus:", st_label), Paragraph(_safe(estatus_label), st_valor)],
    ]

    motivo = str(cita_data.get("motivo", "") or "").strip()
    if motivo:
        cita_rows.append(
            [Paragraph("Motivo:", st_label), Paragraph(_safe(motivo), st_valor)]
        )

    elems.append(_tabla_info(cita_rows))

    # ---------------------------------------------------------------------
    # QR de confirmación
    # ---------------------------------------------------------------------
    token_url = str(cita_data.get("token_url", "") or "").strip()
    if token_url:
        elems.append(Spacer(1, 0.4 * cm))
        elems.append(Paragraph("CONFIRMACIÓN DE ASISTENCIA", st_sec))

        qr_buf = _generar_qr(token_url)
        qr_img = Image(qr_buf, width=4 * cm, height=4 * cm)

        qr_txt = [
            Paragraph("Escanee el QR o use el enlace recibido en su correo.", st_label),
            Spacer(1, 0.2 * cm),
            Paragraph(
                "Puede <b>confirmar</b> o <b>cancelar</b> su asistencia desde ahí.",
                st_label,
            ),
        ]

        qr_table = Table([[qr_img, qr_txt]], colWidths=[4.5 * cm, 12.5 * cm])
        qr_table.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f7fafc")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("BOX", (0, 0), (-1, -1), 0.5, C_LINEA),
            ])
        )
        elems.append(qr_table)

    # ---------------------------------------------------------------------
    # Pie
    # ---------------------------------------------------------------------
    elems.append(Spacer(1, 0.5 * cm))
    elems.append(HRFlowable(width="100%", thickness=0.5, color=C_LINEA))
    elems.append(Spacer(1, 0.2 * cm))
    elems.append(
        Paragraph(
            "Preséntese 10 minutos antes. Traiga este comprobante o su número de expediente.",
            st_aviso,
        )
    )
    folio = str(cita_data.get("id", "") or "")[:8].upper()
    elems.append(Paragraph(f"Folio: {folio}", st_aviso))

    doc.build(elems)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def _tabla_info(rows):
    table = Table(rows, colWidths=[5 * cm, 12 * cm])
    table.setStyle(
        TableStyle([
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [white, HexColor("#f7fafc")]),
            ("BOX", (0, 0), (-1, -1), 0.5, C_LINEA),
            ("GRID", (0, 0), (-1, -1), 0.5, C_LINEA),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    return table


def _generar_qr(url: str) -> io.BytesIO:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def _parse_fecha_hora(value) -> Optional[datetime]:
    if not value:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        try:
            # soporta "2026-03-31T10:00:00" y "2026-03-31T10:00:00+00:00"
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    return None


def _format_fecha_es(value: datetime) -> str:
    meses = {
        1: "enero",
        2: "febrero",
        3: "marzo",
        4: "abril",
        5: "mayo",
        6: "junio",
        7: "julio",
        8: "agosto",
        9: "septiembre",
        10: "octubre",
        11: "noviembre",
        12: "diciembre",
    }
    return f"{value.day} de {meses[value.month]} de {value.year}"


def _safe(value) -> str:
    return str(value or "—")