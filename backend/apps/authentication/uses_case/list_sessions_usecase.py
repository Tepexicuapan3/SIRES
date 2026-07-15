from django.utils import timezone

from apps.authentication.models import SesionUsuario


def list_sessions(page, page_size, usuario=None, solo_activas=False):
    # Lista de conexiones (historial + activas) para la vista admin.
    queryset = SesionUsuario.objects.select_related("usuario", "usuario__detalle")

    if usuario:
        queryset = queryset.filter(usuario__usuario__icontains=usuario)
    if solo_activas:
        queryset = queryset.filter(fch_fin__isnull=True)

    total = queryset.count()
    start = (page - 1) * page_size
    items = list(queryset[start : start + page_size])

    return {
        "items": [_serialize_session(item) for item in items],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }


def _serialize_session(sesion):
    detalle = getattr(sesion.usuario, "detalle", None)
    fin = sesion.fch_fin or timezone.now()
    duracion_segundos = int((fin - sesion.fch_inicio).total_seconds())

    return {
        "id": sesion.id_sesion,
        "usuario": sesion.usuario.usuario,
        "nombreCompleto": detalle.nombre_completo if detalle else sesion.usuario.usuario,
        "ipOrigen": sesion.ip_origen,
        "userAgent": sesion.user_agent,
        "fechaInicio": sesion.fch_inicio.isoformat(),
        "fechaFin": sesion.fch_fin.isoformat() if sesion.fch_fin else None,
        "duracionSegundos": duracion_segundos,
        "estado": "ACTIVA" if sesion.fch_fin is None else "CERRADA",
        "cerradaPor": sesion.cerrada_por,
    }
