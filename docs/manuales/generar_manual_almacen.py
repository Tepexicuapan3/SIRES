# -*- coding: utf-8 -*-
"""Genera el manual de usuario del módulo de Almacén de Insumos en PDF."""

import os

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable,
)

OUT_PATH = os.path.join(os.path.dirname(__file__), "Manual_Almacen_Insumos.pdf")

styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    name="Portada", parent=styles["Title"], fontSize=26, leading=32,
    spaceAfter=12, alignment=1,
))
styles.add(ParagraphStyle(
    name="Subportada", parent=styles["Normal"], fontSize=13, leading=18,
    alignment=1, textColor=colors.HexColor("#555555"), spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="H1", parent=styles["Heading1"], fontSize=18, spaceBefore=18,
    spaceAfter=8, textColor=colors.HexColor("#1f3a5f"),
))
styles.add(ParagraphStyle(
    name="H2", parent=styles["Heading2"], fontSize=14, spaceBefore=12,
    spaceAfter=6, textColor=colors.HexColor("#2b5a8c"),
))
styles.add(ParagraphStyle(
    name="H3", parent=styles["Heading3"], fontSize=11.5, spaceBefore=8,
    spaceAfter=4, textColor=colors.HexColor("#3a3a3a"),
))
styles.add(ParagraphStyle(
    name="Body", parent=styles["Normal"], fontSize=10, leading=14.5,
    spaceAfter=6, alignment=4,
))
styles.add(ParagraphStyle(
    name="Nota", parent=styles["Normal"], fontSize=9, leading=13,
    textColor=colors.HexColor("#5a5a5a"), backColor=colors.HexColor("#f4f6f8"),
    borderPadding=6, spaceAfter=8, spaceBefore=4,
))
styles.add(ParagraphStyle(
    name="Paso", parent=styles["Normal"], fontSize=10, leading=14.5,
    spaceAfter=4, leftIndent=10,
))

TABLE_HEADER_BG = colors.HexColor("#1f3a5f")
TABLE_ROW_BG = colors.HexColor("#eef2f6")


def field_table(rows, col_widths=(5.5 * cm, 11 * cm)):
    data = [["Campo", "Descripción"]] + rows
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_ROW_BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def steps(items):
    return ListFlowable(
        [ListItem(p(i, "Paso"), leftIndent=14) for i in items],
        bulletType="1", start=1,
    )


def bullets(items):
    return ListFlowable(
        [ListItem(p(i, "Paso"), leftIndent=14) for i in items],
        bulletType="bullet", start="•",
    )


story = []

# ── Portada ──────────────────────────────────────────────────────────────
story.append(Spacer(1, 6 * cm))
story.append(p("Manual de Usuario", "Portada"))
story.append(p("Módulo de Almacén de Insumos", "Portada"))
story.append(Spacer(1, 0.5 * cm))
story.append(p("SISEM — Sistema Integral de Salud y Expedientes Médicos", "Subportada"))
story.append(p("Guía paso a paso con ejemplos de uso", "Subportada"))
story.append(PageBreak())

# ── Índice / Introducción ────────────────────────────────────────────────
story.append(p("1. Introducción", "H1"))
story.append(p(
    "El módulo de <b>Almacén de Insumos</b> permite controlar el inventario de material médico "
    "y de consumo de la clínica: registrar entradas (compras o donaciones), salidas, mermas, "
    "devoluciones a proveedor, consumos durante las consultas, y realizar conteos físicos "
    "periódicos para verificar las existencias reales contra el sistema.",
    "Body",
))
story.append(p(
    "Todas las pantallas se encuentran dentro del menú lateral <b>Almacén</b>, organizado en "
    "cuatro grupos:", "Body",
))
story.append(bullets([
    "<b>Dashboard</b>: resumen general del inventario.",
    "<b>Catálogos</b>: Insumos, Categorías, Proveedores, Unidades de medida y Almacenes.",
    "<b>Movimientos</b>: Entradas, Salidas / Mermas y Consumos por consulta.",
    "<b>Inventario</b>: Existencias, Kardex y Conteos físicos.",
]))
story.append(p(
    "Cada acción que modifica el inventario (entrada, salida, consumo o ajuste por conteo) "
    "genera automáticamente un registro en el <b>Kardex de Movimientos</b>, que es el historial "
    "completo e inmutable de todos los movimientos del almacén.",
    "Nota",
))

# ── 2. Dashboard ─────────────────────────────────────────────────────────
story.append(p("2. Dashboard del Almacén", "H1"))
story.append(p(
    "Ruta: <b>Almacén → Dashboard</b>. Es la pantalla de inicio del módulo y muestra un panorama "
    "rápido del estado del inventario, actualizado automáticamente cada 60 segundos.",
    "Body",
))
story.append(p("Indicadores que muestra:", "H3"))
story.append(bullets([
    "<b>Insumos activos</b>: cantidad total de insumos dados de alta en el catálogo.",
    "<b>Bajo stock mínimo</b>: cantidad de insumos cuya existencia está por debajo del mínimo "
    "configurado (se resalta en rojo como alerta).",
    "<b>Entradas este mes</b>, <b>Salidas este mes</b> y <b>Consumos este mes</b>: totales del "
    "mes en curso.",
]))
story.append(p(
    "Debajo de los indicadores aparece la tabla <b>Últimos movimientos</b>, con el insumo, "
    "tipo de movimiento (Entrada, Salida, Consumo, Merma, Ajuste, etc.), cantidad y fecha/hora.",
    "Body",
))

# ── 3. Catálogos ─────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(p("3. Catálogos base", "H1"))
story.append(p(
    "Antes de registrar movimientos es necesario tener configurados los catálogos base. Se "
    "recomienda darlos de alta en este orden: <b>Unidades de medida → Categorías → Proveedores "
    "→ Almacenes → Insumos</b>, ya que Insumos depende de Categorías y Unidades de medida.",
    "Nota",
))
story.append(p(
    "Todos los catálogos comparten la misma operación básica:", "Body",
))
story.append(steps([
    "Hacer clic en el botón <b>“Nuevo …”</b> (esquina superior derecha de la tabla).",
    "Completar el formulario. Los campos marcados con <b>*</b> son obligatorios.",
    "Hacer clic en <b>Crear</b> (o <b>Guardar</b> en el caso de edición).",
    "Para editar un registro existente, hacer clic en el ícono de lápiz (✏) de la fila.",
    "Para eliminar (baja lógica) un registro, hacer clic en el ícono de papelera (🗑) y "
    "confirmar en el cuadro de diálogo.",
]))

# 3.1 Unidades de medida
story.append(p("3.1 Unidades de medida", "H2"))
story.append(p("Ruta: <b>Almacén → Catálogos → Unidades de medida</b>.", "Body"))
story.append(p(
    "Define las unidades en las que se manejan los insumos (caja, pieza, frasco, ml, mg, "
    "paquete, etc.). Se usan al dar de alta cada insumo.",
    "Body",
))
story.append(field_table([
    ["Nombre", "Nombre completo de la unidad. Ejemplo: <i>Caja</i>, <i>Mililitro</i>."],
    ["Abreviación", "Abreviatura corta que se muestra en tablas y formularios. "
                     "Ejemplo: <i>CJA</i>, <i>ML</i>."],
]))
story.append(p(
    "<b>Ejemplo:</b> Nombre = “Caja”, Abreviación = “CJA”.", "Nota",
))

# 3.2 Categorías
story.append(p("3.2 Categorías de Insumos", "H2"))
story.append(p("Ruta: <b>Almacén → Catálogos → Categorías</b>.", "Body"))
story.append(p(
    "Agrupa los insumos por tipo (medicamentos, material de curación, oxígeno, papelería "
    "médica, etc.) para facilitar la búsqueda y los reportes.",
    "Body",
))
story.append(field_table([
    ["Nombre", "Nombre de la categoría. Ejemplo: <i>Material de curación</i>."],
    ["Descripción", "Texto libre, opcional, para aclarar el alcance de la categoría."],
]))
story.append(p(
    "<b>Ejemplo:</b> Nombre = “Material de curación”, Descripción = “Gasas, guantes, "
    "vendas, alcohol, etc.”", "Nota",
))

# 3.3 Proveedores
story.append(p("3.3 Proveedores", "H2"))
story.append(p("Ruta: <b>Almacén → Catálogos → Proveedores</b>.", "Body"))
story.append(p(
    "Catálogo de proveedores que surten insumos a la clínica. Se utiliza al registrar "
    "entradas de inventario y devoluciones.",
    "Body",
))
story.append(field_table([
    ["Nombre", "Razón social o nombre comercial del proveedor."],
    ["Contacto", "Nombre de la persona de contacto (opcional)."],
    ["Teléfono", "Teléfono de contacto (opcional)."],
    ["Correo", "Correo electrónico de contacto (opcional)."],
    ["RFC", "RFC del proveedor, hasta 15 caracteres (opcional)."],
    ["Dirección", "Domicilio del proveedor (opcional)."],
]))
story.append(p(
    "<b>Ejemplo:</b> Nombre = “Distribuidora Médica del Centro S.A.”, "
    "Contacto = “Lic. Pérez”, Teléfono = “55 1234 5678”, RFC = “DMC850101AAA”.",
    "Nota",
))

# 3.4 Almacenes
story.append(p("3.4 Almacenes", "H2"))
story.append(p("Ruta: <b>Almacén → Catálogos → Almacenes</b>.", "Body"))
story.append(p(
    "Define los almacenes físicos o lógicos donde se guardan los insumos (bodega general, "
    "farmacia, consultorio, etc.). Cada movimiento de inventario (entrada, salida, consumo, "
    "conteo) se hace siempre contra un almacén específico.",
    "Body",
))
story.append(field_table([
    ["Nombre", "Nombre del almacén. Ejemplo: <i>Almacén General</i>."],
    ["Tipo", "Tipo de almacén: <i>General</i>, <i>Consultorio</i>, <i>Farmacia</i> o "
             "<i>Médico</i>."],
    ["Centro de atención", "Clínica o unidad a la que pertenece el almacén "
                            "(se elige de una lista)."],
    ["Descripción", "Información adicional, opcional."],
]))
story.append(p(
    "<b>Ejemplo:</b> Nombre = “Almacén General Clínica 1”, Tipo = “General”, "
    "Centro de atención = “Clínica 1”.", "Nota",
))

# 3.5 Insumos
story.append(p("3.5 Insumos", "H2"))
story.append(p("Ruta: <b>Almacén → Catálogos → Insumos</b>.", "Body"))
story.append(p(
    "Es el catálogo principal: aquí se da de alta cada producto que se controla en el "
    "inventario (medicamentos, material de curación, oxígeno, etc.).",
    "Body",
))
story.append(field_table([
    ["Nombre *", "Nombre del insumo. Ejemplo: <i>Gasas estériles 10x10 cm</i>."],
    ["Código *", "Código interno del insumo. Ejemplo: <i>INS-001</i>."],
    ["Código de barras", "Código de barras del producto (opcional). Permite escanearlo "
                          "directamente al registrar entradas."],
    ["Categoría *", "Categoría a la que pertenece (debe existir previamente)."],
    ["Unidad de medida *", "Unidad en la que se controla (debe existir previamente)."],
    ["Stock mínimo", "Cantidad mínima deseada en existencia. Si la existencia cae por "
                      "debajo de este valor, se marca como “Bajo mínimo” en el Dashboard "
                      "y en Existencias."],
    ["Requiere lote", "Activar si el insumo se controla por número de lote "
                       "(por ejemplo, medicamentos)."],
    ["Requiere caducidad", "Activar si el insumo tiene fecha de caducidad."],
]))
story.append(p(
    "<b>Ejemplo:</b> Nombre = “Paracetamol 500 mg”, Código = “MED-0042”, "
    "Categoría = “Medicamentos”, Unidad de medida = “Caja”, Stock mínimo = “10”, "
    "Requiere lote = activado, Requiere caducidad = activado.",
    "Nota",
))
story.append(p(
    "Para editar un insumo, hacer clic en el ícono de lápiz de la fila correspondiente; "
    "se abrirá el mismo formulario con los datos precargados.",
    "Body",
))

# ── 4. Movimientos ───────────────────────────────────────────────────────
story.append(PageBreak())
story.append(p("4. Movimientos de inventario", "H1"))
story.append(p(
    "Esta sección agrupa las operaciones que dan de alta o de baja existencias: entradas, "
    "salidas/mermas/devoluciones y consumos por consulta. Cada registro generado aquí queda "
    "reflejado automáticamente en el <b>Kardex</b> y actualiza las <b>Existencias</b>.",
    "Body",
))

# 4.1 Entradas
story.append(p("4.1 Entradas de inventario", "H2"))
story.append(p(
    "Ruta: <b>Almacén → Movimientos → Entradas</b>. Sirve para registrar el ingreso de "
    "insumos al almacén (compras, donaciones, traspasos recibidos).",
    "Body",
))
story.append(p("Pasos para registrar una entrada:", "H3"))
story.append(steps([
    "Hacer clic en <b>“Nueva entrada”</b>.",
    "En la sección de cabecera, seleccionar el <b>Almacén *</b> de destino.",
    "Opcionalmente, seleccionar el <b>Proveedor</b> que entregó los insumos.",
    "Capturar el <b>Número de remisión</b> (factura o nota de remisión) si aplica.",
    "Verificar/ajustar la <b>Fecha de entrada *</b> (por defecto es la fecha actual).",
    "Agregar una <b>Observación</b> si es necesario.",
    "En la tabla de insumos, por cada producto recibido:",
])
)
story.append(bullets([
    "Usar el campo <b>“Código / escaneo”</b> con un lector de código de barras USB, o bien "
    "seleccionar el insumo manualmente del listado <b>Insumo</b>.",
    "Si el insumo requiere lote, capturar el <b>Número de lote</b> (se crea automáticamente "
    "si no existe) y, si requiere caducidad, la <b>Fecha de caducidad</b>.",
    "Capturar la <b>Cantidad *</b> recibida.",
    "Opcionalmente, capturar el <b>Costo unitario</b>.",
]))
story.append(steps([
    "Para agregar más productos, hacer clic en <b>“Agregar fila”</b>. Para quitar una fila, "
    "usar el ícono de papelera.",
    "Hacer clic en <b>“Registrar entrada”</b>.",
], ))
story.append(p(
    "<b>Ejemplo:</b> Se recibe una remisión “REM-1023” del proveedor “Distribuidora Médica "
    "del Centro”, con destino al “Almacén General Clínica 1”, fecha 12/06/2026, con dos "
    "líneas: Paracetamol 500 mg, lote “L2026A”, caducidad 12/2027, cantidad 20 cajas, "
    "costo unitario $45.00; y Gasas estériles 10x10 cm, cantidad 100 piezas, sin lote.",
    "Nota",
))
story.append(p(
    "Las entradas no se pueden editar ni eliminar una vez registradas (son inmutables). "
    "Para corregir un error, se debe registrar una salida/ajuste o consultar al "
    "administrador del sistema. Cada entrada puede consultarse en detalle haciendo clic en "
    "el ícono de ojo (👁) de la fila.",
    "Body",
))

# 4.2 Salidas
story.append(p("4.2 Salidas / Mermas / Devoluciones", "H2"))
story.append(p(
    "Ruta: <b>Almacén → Movimientos → Salidas / Mermas</b>. Sirve para registrar salidas de "
    "inventario que no corresponden a un consumo de consulta: salidas directas, mermas "
    "(pérdidas, caducados, daños) o devoluciones a proveedor.",
    "Body",
))
story.append(p("Pasos para registrar una salida:", "H3"))
story.append(steps([
    "Hacer clic en <b>“Nueva salida”</b>.",
    "Seleccionar el <b>Almacén *</b> del cual saldrán los insumos.",
    "Seleccionar el <b>Tipo *</b>: “Salida directa”, “Merma / Pérdida” o "
    "“Devolución a proveedor”.",
    "Capturar el <b>Número de folio</b> si aplica.",
    "Verificar/ajustar la <b>Fecha *</b>.",
    "Capturar el <b>Motivo</b> (recomendado, especialmente en mermas).",
    "En la tabla de insumos, seleccionar el <b>Insumo *</b>, el <b>Lote</b> "
    "(si aplica — el sistema solo muestra los lotes con existencia disponible para ese "
    "insumo) y la <b>Cantidad *</b> a dar de salida.",
    "Hacer clic en <b>“Registrar salida”</b>.",
]))
story.append(p(
    "<b>Ejemplo (merma):</b> Almacén = “Almacén General Clínica 1”, Tipo = “Merma / Pérdida”, "
    "Fecha = 12/06/2026, Motivo = “Frascos rotos durante traslado”, "
    "Insumo = “Alcohol en gel 1 L”, Cantidad = 3.",
    "Nota",
))
story.append(p(
    "El sistema valida que exista suficiente existencia disponible del insumo/lote "
    "seleccionado; si la cantidad solicitada supera el stock, mostrará un mensaje de error "
    "y no permitirá registrar la salida.",
    "Body",
))

# 4.3 Consumos
story.append(p("4.3 Consumos por consulta", "H2"))
story.append(p(
    "Ruta: <b>Almacén → Movimientos → Consumos por consulta</b>. Sirve para registrar los "
    "insumos que se utilizan durante una consulta médica (por ejemplo, material de curación "
    "usado en un paciente).",
    "Body",
))
story.append(p("Pasos para registrar un consumo:", "H3"))
story.append(steps([
    "Hacer clic en <b>“Nuevo consumo”</b>.",
    "Seleccionar el <b>Almacén *</b> del que se tomarán los insumos (normalmente el almacén "
    "del consultorio).",
    "Verificar/ajustar la <b>Fecha *</b>.",
    "Capturar, si se desea, el nombre del <b>Paciente</b> y del <b>Médico</b>.",
    "Agregar una <b>Observación</b> si es necesario.",
    "En la tabla “Insumos utilizados”, seleccionar el <b>Insumo *</b>, el <b>Lote</b> "
    "(si aplica) y la <b>Cantidad *</b> utilizada.",
    "Hacer clic en <b>“Registrar consumo”</b>.",
]))
story.append(p(
    "<b>Ejemplo:</b> Almacén = “Almacén Consultorio 3”, Fecha = 12/06/2026, "
    "Paciente = “Juan Pérez López”, Médico = “Dra. Ramírez”, "
    "Insumo = “Gasas estériles 10x10 cm”, Cantidad = 4; "
    "Insumo = “Guantes de látex talla M”, Cantidad = 2.",
    "Nota",
))

# ── 5. Inventario ────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(p("5. Inventario", "H1"))

# 5.1 Existencias
story.append(p("5.1 Existencias", "H2"))
story.append(p(
    "Ruta: <b>Almacén → Inventario → Existencias</b>. Muestra el saldo actual de cada "
    "insumo, por almacén y por lote (si aplica), calculado automáticamente a partir de "
    "todos los movimientos registrados.",
    "Body",
))
story.append(field_table([
    ["Código / Insumo", "Identificación y nombre del insumo. Si la existencia está por "
                         "debajo del mínimo configurado, se muestra un ícono de alerta (⚠)."],
    ["Almacén", "Almacén al que corresponde el saldo."],
    ["Lote / Caducidad", "Lote y fecha de caducidad, si el insumo los maneja."],
    ["Existencia", "Cantidad actual disponible."],
    ["Mínimo", "Stock mínimo configurado en el catálogo de Insumos."],
    ["Estado", "“OK” si la existencia es suficiente, o “Bajo mínimo” (en rojo) si está por "
                "debajo del stock mínimo."],
]))
story.append(p(
    "Para ver únicamente los insumos en alerta, usar el botón <b>“Bajo mínimo”</b> de la "
    "barra superior; se puede combinar con el buscador por nombre o código.",
    "Body",
))

# 5.2 Kardex
story.append(p("5.2 Kardex de movimientos", "H2"))
story.append(p(
    "Ruta: <b>Almacén → Inventario → Kardex</b>. Es el historial completo e inmutable de "
    "todos los movimientos de inventario: entradas, salidas, mermas, devoluciones, consumos "
    "y ajustes generados por conteos físicos.",
    "Body",
))
story.append(field_table([
    ["Fecha", "Fecha y hora del movimiento."],
    ["Tipo", "Entrada, Salida, Devolución, Merma, Consumo, Ajuste positivo o "
              "Ajuste negativo."],
    ["Insumo / Lote", "Insumo afectado y, si aplica, número de lote."],
    ["Cantidad", "Cantidad del movimiento (entradas/ajustes positivos suman, "
                  "salidas/mermas/ajustes negativos restan)."],
    ["Saldo", "Existencia resultante después de aplicar el movimiento."],
    ["Origen", "Documento que generó el movimiento (por ejemplo, "
                "“EntradaInventarioDetail #15”), útil para rastrear de dónde proviene "
                "cada cambio."],
]))
story.append(p(
    "Esta pantalla es solo de consulta: no se pueden crear, editar ni eliminar movimientos "
    "directamente desde aquí. Toda la información proviene de las pantallas de Entradas, "
    "Salidas, Consumos y Conteos.",
    "Nota",
))

# 5.3 Conteos físicos
story.append(p("5.3 Conteos físicos", "H2"))
story.append(p(
    "Ruta: <b>Almacén → Inventario → Conteos físicos</b>. Permite hacer un inventario físico "
    "de un almacén, comparar las cantidades contadas contra lo que indica el sistema, y "
    "generar automáticamente los ajustes (positivos o negativos) en el Kardex al cerrar el "
    "conteo.",
    "Body",
))
story.append(p("Paso 1 — Iniciar el conteo:", "H3"))
story.append(steps([
    "Hacer clic en <b>“Nuevo conteo”</b>.",
    "Seleccionar el <b>Almacén *</b> a inventariar.",
    "Verificar/ajustar la <b>Fecha del conteo *</b>.",
    "Agregar una <b>Observación</b> si se desea.",
    "Hacer clic en <b>“Iniciar conteo”</b>.",
]))
story.append(p(
    "Al crearse, el sistema precarga automáticamente todas las existencias actuales del "
    "almacén seleccionado como “cantidad del sistema” para cada insumo/lote. El conteo "
    "queda con estado <b>“Abierto”</b>.",
    "Body",
))
story.append(p("Paso 2 — Cerrar el conteo:", "H3"))
story.append(steps([
    "En la tabla de Conteos, ubicar el conteo en estado <b>“Abierto”</b> y hacer clic en "
    "<b>“Cerrar”</b>.",
    "Para cada insumo/lote, capturar en la columna <b>“Física”</b> la cantidad real "
    "contada en el almacén.",
    "La columna <b>“Dif.”</b> muestra automáticamente la diferencia entre la cantidad "
    "física capturada y la del sistema (en verde si es positiva, en rojo si es negativa).",
    "Hacer clic en <b>“Cerrar conteo y aplicar ajustes”</b>.",
]))
story.append(p(
    "Al cerrar, el sistema genera un movimiento de <b>“Ajuste positivo”</b> por cada "
    "diferencia a favor (se encontró más de lo que indicaba el sistema) y un "
    "<b>“Ajuste negativo”</b> por cada diferencia en contra (faltante). Estos ajustes "
    "quedan registrados en el Kardex y actualizan las Existencias. El conteo pasa a "
    "estado <b>“Cerrado”</b> y ya no puede modificarse.",
    "Nota",
))
story.append(p(
    "<b>Ejemplo:</b> Se inicia un conteo del “Almacén General Clínica 1” el 12/06/2026. El "
    "sistema precarga “Paracetamol 500 mg” con 18 cajas (saldo en sistema). Al contar "
    "físicamente se encuentran 16 cajas: se captura “16” en la columna Física, la "
    "diferencia muestra “-2”. Al cerrar el conteo, se genera automáticamente un "
    "<b>Ajuste negativo</b> de 2 cajas en el Kardex, y la existencia de Paracetamol 500 mg "
    "queda en 16.",
    "Nota",
))

# ── 6. Glosario ──────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(p("6. Glosario de tipos de movimiento", "H1"))
story.append(field_table([
    ["Entrada", "Ingreso de insumos al almacén (compra, donación, traspaso recibido)."],
    ["Salida", "Salida directa de insumos sin que sea consumo de consulta ni merma."],
    ["Devolución", "Devolución de insumos a un proveedor."],
    ["Merma", "Pérdida de insumos (daño, caducidad, robo, etc.)."],
    ["Consumo", "Insumos utilizados durante una consulta médica."],
    ["Ajuste positivo", "Incremento de existencia generado al cerrar un conteo físico "
                         "cuando lo contado es mayor a lo registrado en el sistema."],
    ["Ajuste negativo", "Reducción de existencia generada al cerrar un conteo físico "
                         "cuando lo contado es menor a lo registrado en el sistema."],
], col_widths=(4 * cm, 12.5 * cm)))

story.append(Spacer(1, 0.6 * cm))
story.append(HRFlowable(width="100%", color=colors.HexColor("#cccccc")))
story.append(Spacer(1, 0.2 * cm))
story.append(p(
    "<i>Este manual describe la funcionalidad disponible en el módulo de Almacén de "
    "Insumos del sistema SISEM al momento de su generación. La apariencia de las pantallas "
    "puede variar levemente según actualizaciones posteriores del sistema.</i>",
    "Body",
))

doc = SimpleDocTemplate(
    OUT_PATH, pagesize=LETTER,
    topMargin=2 * cm, bottomMargin=2 * cm,
    leftMargin=2 * cm, rightMargin=2 * cm,
    title="Manual de Usuario - Almacén de Insumos - SISEM",
)
doc.build(story)
print(f"PDF generado en: {OUT_PATH}")
