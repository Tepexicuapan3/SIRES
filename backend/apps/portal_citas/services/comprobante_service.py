"""
apps/portal_citas/services/comprobante_service.py
====================================================
Firma HMAC del folio y payload del código QR del comprobante de cita
reservada desde el portal (Fase 5).

Formato EXACTO del payload QR (documentado acá para la Fase 7, que valida
el QR durante el check-in en recepción):

    "{folio}:{firma}"

- ``folio``: el folio de la cita, formato ``CIT-XXXXXXXXXX`` (ver
  ``apps.recepcion.models.CitaMedica.generar_folio``). Nunca contiene ":".
- ``firma``: HMAC-SHA256 (hexdigest, 64 caracteres hex en minúsculas,
  tampoco contiene ":") del folio, calculado con ``settings.SECRET_KEY``
  como clave -- mismo patrón que ``services.otp_service.hash_code`` usa
  para los códigos OTP (Fase 2), aplicado acá sobre el folio en vez de
  sobre un código de un solo uso.

Se eligió un string plano "folio:firma" (no JSON) porque es lo más simple
de parsear en la Fase 7: ``payload.partition(":")``, sin ``json.loads`` ni
manejo de excepciones de parseo de JSON. Ver ``verificar_payload_qr`` acá
mismo para la función de validación que la Fase 7 puede reusar tal cual.
"""

import hashlib
import hmac
import io

from django.conf import settings


def firmar_folio(folio: str) -> str:
    """HMAC-SHA256 del folio. Mismo patrón que ``otp_service.hash_code``."""
    return hmac.new(
        settings.SECRET_KEY.encode(),
        folio.encode(),
        hashlib.sha256,
    ).hexdigest()


def construir_payload_qr(folio: str) -> str:
    """Payload que se codifica en el QR. Formato: ``"{folio}:{firma}"``."""
    return f"{folio}:{firmar_folio(folio)}"


def verificar_payload_qr(payload: str) -> str | None:
    """
    Valida un payload leído de un QR y devuelve el folio si la firma HMAC
    corresponde, o ``None`` si el payload está mal formado o la firma no
    coincide (comparación en tiempo constante, igual que
    ``otp_service.verify_code``).

    Provista acá -- junto a la firma -- para que la Fase 7 (check-in) la
    reuse sin reimplementar el formato del payload.
    """
    if not payload or ":" not in payload:
        return None

    folio, _, firma = payload.partition(":")
    if not folio or not firma:
        return None

    if not hmac.compare_digest(firma, firmar_folio(folio)):
        return None

    return folio


def generar_qr_png(payload: str) -> bytes:
    """Genera la imagen QR (PNG) del payload dado, en memoria (sin tocar disco)."""
    import qrcode

    imagen = qrcode.make(payload)
    buffer = io.BytesIO()
    imagen.save(buffer, format="PNG")
    return buffer.getvalue()
