from decimal import ROUND_HALF_UP, Decimal


def calculate_bmi(weight_kg, height_cm):
    """
    IMC = peso(kg) / talla(m)^2, redondeado a 2 decimales (ROUND_HALF_UP).

    Unico calculo compartido entre captura (POST) y edicion auditada
    (PATCH, Fase 3) -- antes vivia duplicado como `_calculate_bmi` dentro
    de `capture_vitals_usecase.py`. Cualquier cambio de formula/redondeo
    se hace en UN solo lugar.
    """
    height_m = Decimal(height_cm) / Decimal("100")
    bmi = Decimal(weight_kg) / (height_m * height_m)
    return bmi.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
