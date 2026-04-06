from django.urls import path
from .views import ver_receta

urlpatterns = [
    path("receta/<int:id>/", ver_receta, name="ver_receta"),
]