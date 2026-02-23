from django.urls import path

from apps.recepcion.views import VisitStatusView, VisitsView

urlpatterns = [
    path("visits", VisitsView.as_view(), name="visits"),
    path("visits/<int:visit_id>/status", VisitStatusView.as_view(), name="visits-status"),
]
