from django.urls import path
from .views import (
    VacInventarioListCreateView,
    VacInventarioDetailView,
    VacInventarioApplyDosesView,
)

urlpatterns = [
    path("vaccine-inventory/", VacInventarioListCreateView.as_view()),
    path("vaccine-inventory/<int:pk>/", VacInventarioDetailView.as_view()),
    path("vaccine-inventory/<int:pk>/apply-doses/", VacInventarioApplyDosesView.as_view()),
]
