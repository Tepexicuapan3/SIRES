"""
apps/recepcion/urls.py
======================
Rutas del módulo de recepción, incluyendo citas médicas.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    VisitStatusView,
    VisitsView,
    NucleoFamiliarView,
    BuscarEmpleadosView,
    DisponibilidadView,
    CitasViewSet,
    AccionTokenView,
)

router = DefaultRouter()
router.register(r"citas", CitasViewSet, basename="citas")

urlpatterns = [
    # ---------------------------------------------------------------------
    # Visits
    # ---------------------------------------------------------------------
    path("visits/", VisitsView.as_view(), name="visits"),
    path("visits/<int:visit_id>/status/", VisitStatusView.as_view(), name="visits-status"),

    # ---------------------------------------------------------------------
    # Citas médicas
    # ---------------------------------------------------------------------
    path(
        "citas/nucleo-familiar/<int:no_exp>/",
        NucleoFamiliarView.as_view(),
        name="citas-nucleo-familiar",
    ),
    path(
        "citas/buscar-empleados/",
        BuscarEmpleadosView.as_view(),
        name="citas-buscar-empleados",
    ),
    path(
        "citas/disponibilidad/",
        DisponibilidadView.as_view(),
        name="citas-disponibilidad",
    ),
    path(
        "accion/<uuid:token>/<str:accion>/",
        AccionTokenView.as_view(),
        name="citas-accion-token",
    ),

    # ViewSet de citas:
    #   GET    /citas/
    #   POST   /citas/
    #   GET    /citas/{id}/
    #   POST   /citas/{id}/cancelar/
    #   GET    /citas/{id}/pdf/
    path("", include(router.urls)),
]