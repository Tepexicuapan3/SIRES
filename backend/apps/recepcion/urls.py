from django.urls import path

from apps.recepcion.views import PatientLookupView, VisitStatusLogView, VisitStatusView, VisitsView
from apps.recepcion.views.citas_views import (
    CitasListCreateView,
    CitaDetailView,
    CitaEstatusView,
    SlotsDisponiblesView,
)
from apps.recepcion.views.agenda_views import AgendaSemanalView
from apps.recepcion.views.ficha_views import FichaVisitView
from apps.recepcion.views.turno_views import (
    TurnoFichaListCreateView, TurnoFichaDetailView, TurnoActualView,
)

urlpatterns = [
    # ── Visitas (check-in y cola de recepción) ────────────────────────────────
    path("visits",                          VisitsView.as_view(),        name="visits"),
    path("visits/<int:visit_id>/status",    VisitStatusView.as_view(),   name="visits-status"),
    path("visits/<int:visit_id>/ficha",       FichaVisitView.as_view(),       name="visits-ficha"),
    path("visits/<int:visit_id>/status-log", VisitStatusLogView.as_view(),   name="visits-status-log"),
    path("visits/patient-lookup",            PatientLookupView.as_view(),    name="visits-patient-lookup"),

    # ── Turnos de fichas ──────────────────────────────────────────────────────
    path("turnos-ficha",              TurnoFichaListCreateView.as_view(), name="turnos-ficha"),
    path("turnos-ficha/actual",       TurnoActualView.as_view(),          name="turno-actual"),
    path("turnos-ficha/<int:turno_id>", TurnoFichaDetailView.as_view(),   name="turno-ficha-detail"),

    # ── Citas médicas ─────────────────────────────────────────────────────────
    path("citas",                           CitasListCreateView.as_view(), name="citas"),
    path("citas/slots",                     SlotsDisponiblesView.as_view(),  name="citas-slots"),
    path("citas/agenda",                    AgendaSemanalView.as_view(),     name="citas-agenda"),
    path("citas/<int:cita_id>",             CitaDetailView.as_view(),      name="cita-detail"),
    path("citas/<int:cita_id>/estatus",     CitaEstatusView.as_view(),     name="cita-estatus"),
]
