from django.urls import path

from apps.portal_citas.views import (
    CancelarCitaView,
    CapturarCorreoView,
    CentrosPortalView,
    ConsultoriosPortalView,
    DisponibilidadMensualView,
    EspecialidadesPortalView,
    IniciarSesionView,
    NucleoView,
    ReservarCitaView,
    SlotsPortalView,
    VerificarCodigoView,
)

urlpatterns = [
    # ── Autenticación del portal (Fase 2) ──────────────────────────────────────
    path(
        "portal/auth/iniciar-sesion",
        IniciarSesionView.as_view(),
        name="portal-auth-iniciar-sesion",
    ),
    path(
        "portal/auth/capturar-correo",
        CapturarCorreoView.as_view(),
        name="portal-auth-capturar-correo",
    ),
    path(
        "portal/auth/verificar-codigo",
        VerificarCodigoView.as_view(),
        name="portal-auth-verificar-codigo",
    ),

    # ── Núcleo familiar y disponibilidad (Fase 3) ───────────────────────────────
    path("portal/nucleo", NucleoView.as_view(), name="portal-nucleo"),
    path("portal/especialidades", EspecialidadesPortalView.as_view(), name="portal-especialidades"),
    path("portal/centros", CentrosPortalView.as_view(), name="portal-centros"),
    path("portal/consultorios", ConsultoriosPortalView.as_view(), name="portal-consultorios"),
    path(
        "portal/consultorios/<int:consultorio_id>/disponibilidad-mensual",
        DisponibilidadMensualView.as_view(),
        name="portal-consultorios-disponibilidad-mensual",
    ),
    path("portal/slots", SlotsPortalView.as_view(), name="portal-slots"),

    # ── Reserva de cita (Fase 4) ─────────────────────────────────────────────
    path("portal/citas", ReservarCitaView.as_view(), name="portal-citas-reservar"),

    # ── Cancelación de cita (Fase 6) ─────────────────────────────────────────
    path(
        "portal/citas/<str:folio>/cancelar",
        CancelarCitaView.as_view(),
        name="portal-citas-cancelar",
    ),
]
