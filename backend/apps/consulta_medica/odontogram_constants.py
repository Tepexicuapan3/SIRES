"""
Numeracion FDI (ISO 3950) de piezas dentales, por cuadrante, en el orden
anatomico estandar (de la linea media hacia atras). Permanentes: 11-48
(32 piezas). Deciduas / dientes de leche: 51-85 (20 piezas).
"""

PERMANENT_TEETH_FDI = (
    # Cuadrante 1 -- superior derecho
    "18", "17", "16", "15", "14", "13", "12", "11",
    # Cuadrante 2 -- superior izquierdo
    "21", "22", "23", "24", "25", "26", "27", "28",
    # Cuadrante 4 -- inferior derecho
    "48", "47", "46", "45", "44", "43", "42", "41",
    # Cuadrante 3 -- inferior izquierdo
    "31", "32", "33", "34", "35", "36", "37", "38",
)

DECIDUOUS_TEETH_FDI = (
    # Cuadrante 5 -- superior derecho
    "55", "54", "53", "52", "51",
    # Cuadrante 6 -- superior izquierdo
    "61", "62", "63", "64", "65",
    # Cuadrante 8 -- inferior derecho
    "85", "84", "83", "82", "81",
    # Cuadrante 7 -- inferior izquierdo
    "71", "72", "73", "74", "75",
)

ALL_TEETH_FDI = PERMANENT_TEETH_FDI + DECIDUOUS_TEETH_FDI
