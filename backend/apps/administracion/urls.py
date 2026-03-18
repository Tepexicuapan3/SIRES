from django.urls import path

from .views.rbac_views import (
    AssignRolePermissionsView,
    PermissionsCatalogView,
    RevokeRolePermissionView,
    RoleDetailView,
    RolesListCreateView,
    UserActivateView,
    UserDeactivateView,
    UserDetailView,
    UserOverrideRemoveView,
    UserOverridesView,
    UserPrimaryRoleView,
    UserRoleRevokeView,
    UserRolesView,
    UsersListCreateView,
    
)

from .views.expediente_view import ExpedienteView, ActualizarExpedienteView


urlpatterns = [
    path("roles", RolesListCreateView.as_view(), name="rbac-roles-list-create"),
    path("roles/<int:role_id>", RoleDetailView.as_view(), name="rbac-role-detail"),
    path("permissions", PermissionsCatalogView.as_view(), name="rbac-permissions-list"),
    path("permissions/assign", AssignRolePermissionsView.as_view(), name="rbac-role-permissions-assign"),
    path(
        "permissions/roles/<int:role_id>/permissions/<int:permission_id>",
        RevokeRolePermissionView.as_view(),
        name="rbac-role-permission-revoke",
    ),
    path("users", UsersListCreateView.as_view(), name="rbac-users-list-create"),
    path("users/<int:user_id>", UserDetailView.as_view(), name="rbac-user-detail-update"),
    path("users/<int:user_id>/activate", UserActivateView.as_view(), name="rbac-user-activate"),
    path("users/<int:user_id>/deactivate", UserDeactivateView.as_view(), name="rbac-user-deactivate"),
    path("users/<int:user_id>/roles", UserRolesView.as_view(), name="rbac-user-roles-assign"),
    path("users/<int:user_id>/roles/primary", UserPrimaryRoleView.as_view(), name="rbac-user-role-primary"),
    path("users/<int:user_id>/roles/<int:role_id>", UserRoleRevokeView.as_view(), name="rbac-user-role-revoke"),
    path("users/<int:user_id>/overrides", UserOverridesView.as_view(), name="rbac-user-overrides-upsert"),
    path("users/<int:user_id>/overrides/<str:code>", UserOverrideRemoveView.as_view(), name="rbac-user-override-remove"),
    path('expedientes/', ExpedienteView.as_view(), name='buscar'),
    path('expedientes/actualizar/', ActualizarExpedienteView.as_view(), name='actualizar'),
]
