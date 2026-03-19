import base64
import logging
import zlib
from io import BytesIO

from PIL import Image

logger = logging.getLogger(__name__)


def optimizar_imagen(imagen_blob: bytes) -> str | None:
    """
    Descomprime (zlib), optimiza como JPEG y retorna string base64.
    Equivale a optimizar_imagen() del módulo Flask original.
    """
    try:
        image = Image.open(BytesIO(zlib.decompress(imagen_blob)))
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        with BytesIO() as output:
            image.save(output, format='JPEG', quality=85)
            return base64.b64encode(output.getvalue()).decode('utf-8')
    except Exception as exc:
        logger.error("Error procesando imagen: %s", exc)
        return None
