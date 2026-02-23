import os

from django.urls import path

from .views import (
    CompleteOnboardingView,
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    RequestResetCodeView,
    ResetPasswordView,
    VerifyResetCodeView,
    VerifyView,
)

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("auth/verify", VerifyView.as_view(), name="auth-verify"),
    path("auth/refresh", RefreshView.as_view(), name="auth-refresh"),
    path(
        "auth/complete-onboarding",
        CompleteOnboardingView.as_view(),
        name="auth-complete-onboarding",
    ),
    path(
        "auth/request-reset-code",
        RequestResetCodeView.as_view(),
        name="auth-request-reset-code",
    ),
    path(
        "auth/verify-reset-code",
        VerifyResetCodeView.as_view(),
        name="auth-verify-reset-code",
    ),
    path(
        "auth/reset-password", ResetPasswordView.as_view(), name="auth-reset-password"
    ),
]
