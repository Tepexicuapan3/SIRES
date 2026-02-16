from django.urls import path
from .views.role_views import RoleCreateView

urlpatterns = [
    path("roles", RoleCreateView.as_view()),
]
