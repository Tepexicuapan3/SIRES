from celery import shared_task
from django.utils import timezone

from apps.authentication.infrastructure.policy_store import PolicyStore
from apps.authentication.models import SesionUsuario
from apps.authentication.services.errors import PolicyStoreUnavailableError

policy_store = PolicyStore()


@shared_task
def cerrar_sesiones_abandonadas():
    # Cierra filas de historial cuya sesion ya no es la activa en Redis
    # (TTL vencido por inactividad, o reemplazada por un login/reset
    # posterior). Corre cada 1-2 min via Celery Beat.
    abiertas = SesionUsuario.objects.filter(fch_fin__isnull=True)
    cerradas = 0

    for sesion in abiertas:
        try:
            active_sid = policy_store.get_active_session(sesion.usuario_id)
        except PolicyStoreUnavailableError:
            # Redis caido: no sabemos si la sesion sigue activa o no.
            # Abortamos en vez de cerrar todo por las dudas (evita un
            # "logout masivo" falso positivo por un blip de infraestructura).
            break

        if active_sid == sesion.session_id:
            continue

        SesionUsuario.objects.filter(id_sesion=sesion.id_sesion).update(
            fch_fin=timezone.now(),
            cerrada_por=SesionUsuario.CierrePor.EXPIRACION,
        )
        cerradas += 1

    return cerradas
