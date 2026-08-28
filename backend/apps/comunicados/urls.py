from django.urls import path

from apps.comunicados.views import AnunciosListCreateView, AnuncioDetailView

urlpatterns = [
    # Slash final: convención del proyecto (ver catalogos/urls.py:104-105,
    # "cies/"). APPEND_SLASH de Django no cubre el sentido inverso, así que
    # sin esto el frontend (que sí llama con "/") recibe 404 en cada request.
    path("comunicados/anuncios/", AnunciosListCreateView.as_view(), name="comunicados-anuncios"),
    path(
        "comunicados/anuncios/<int:anuncio_id>/",
        AnuncioDetailView.as_view(),
        name="comunicados-anuncio-detail",
    ),
]
