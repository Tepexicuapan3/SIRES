"""
apps/comunicados/storage.py
=============================
Callables ``upload_to`` para los archivos de ``Anuncio``. Separados de
``models.py`` para poder testearlos sin cargar el ORM (ver design del
change `anuncios-portal-citas`).

El nombre del archivo guardado se deriva 100% de ``uuid4().hex`` -- nunca
del nombre original ni de un ID incremental. Es la mitigación acordada al
riesgo aceptado de que nginx sirve ``/media/`` directo con ``alias``, sin
pasar por Django (decisión 5 del índice de arquitectura
`architecture/anuncios-portal-citas`): un nombre no derivado del original
no es enumerable, no colisiona y no permite path traversal.
"""

import os
import uuid

from django.utils import timezone


def anuncio_upload_to(instance, filename):
    ext = (os.path.splitext(filename)[1] or "").lower()[:10]
    return f"anuncios/{timezone.now():%Y/%m}/{uuid.uuid4().hex}{ext}"


def adjunto_upload_to(instance, filename):
    ext = (os.path.splitext(filename)[1] or "").lower()[:10]
    return f"anuncios/{timezone.now():%Y/%m}/{uuid.uuid4().hex}{ext}"
