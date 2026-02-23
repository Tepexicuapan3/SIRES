from django.urls import path

from apps.somatometria.views import VisitVitalsView

urlpatterns = [
    path("visits/<int:visit_id>/vitals", VisitVitalsView.as_view(), name="visit-vitals"),
]
