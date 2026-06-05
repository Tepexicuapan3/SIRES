from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ContratoOxigenoViewSet

router = DefaultRouter()
router.register(r"contratos-oxigeno", ContratoOxigenoViewSet, basename="contrato-oxigeno")

urlpatterns = [
    path("", include(router.urls)),
]
