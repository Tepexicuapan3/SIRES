from django.urls import path

from apps.consulta_medica.views import (
    VisitCieSearchView,
    VisitConsultationCloseView,
    VisitConsultationStartView,
    VisitDiagnosisSaveView,
    VisitPrescriptionsSaveView,
)


urlpatterns = [
    path(
        "visits/cies/search",
        VisitCieSearchView.as_view(),
        name="visit-cies-search",
    ),
    path(
        "visits/<int:visit_id>/diagnosis",
        VisitDiagnosisSaveView.as_view(),
        name="visit-diagnosis-save",
    ),
    path(
        "visits/<int:visit_id>/prescriptions",
        VisitPrescriptionsSaveView.as_view(),
        name="visit-prescriptions-save",
    ),
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
    path(
        "visits/<int:visit_id>/close",
        VisitConsultationCloseView.as_view(),
        name="visit-close",
    ),
]
