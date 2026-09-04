"""
apps/consulta_medica/storage.py
================================
Callable ``upload_to`` para el archivo de resultado de estudio
(``StudyResult.file``). Mismo criterio de seguridad ya documentado en
``apps.comunicados.storage``: el nombre guardado se deriva 100% de
``uuid4().hex``, nunca del nombre original ni de un ID incremental, porque
nginx sirve ``/media/`` directo con ``alias`` sin pasar por Django.
"""

import os
import uuid

from django.utils import timezone


def study_result_upload_to(instance, filename):
    ext = (os.path.splitext(filename)[1] or "").lower()[:10]
    return f"estudios/{timezone.now():%Y/%m}/{uuid.uuid4().hex}{ext}"
