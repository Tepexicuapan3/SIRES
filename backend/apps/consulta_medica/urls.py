from django.urls import path

from apps.consulta_medica.views import (
    VisitConsultationCloseView,
    VisitConsultationStartView,
)


urlpatterns = [
    path(
        "visits/<int:visit_id>/consultation/start",
        VisitConsultationStartView.as_view(),
        name="visit-consultation-start",
    ),
    path(
        "visits/<int:visit_id>/consultation/close",
        VisitConsultationCloseView.as_view(),
        name="visit-consultation-close",
    ),
]
