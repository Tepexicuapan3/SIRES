import secrets
from datetime import timedelta

from django.conf import settings
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.exceptions import TokenBackendError, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

ACCESS_COOKIE = "access_token_cookie"
REFRESH_COOKIE = "refresh_token_cookie"
CSRF_COOKIE = "csrf_token"
RESET_COOKIE = "reset_token"

ACCESS_MAX_AGE = 60 * 15
REFRESH_MAX_AGE = 60 * 60 * 24 * 7
CSRF_MAX_AGE = 60 * 15
RESET_MAX_AGE = 60 * 10


def _cookie_secure() -> bool:
    # En local (http) los navegadores ignoran cookies `Secure`.
    # En prod (https) queremos `Secure=True`.
    return not getattr(settings, "DEBUG", False)


def generate_csrf_token():
    # Token anti-CSRF leido por el frontend.
    return secrets.token_urlsafe(32)


def create_access_refresh_tokens(user):
    # Genera access y refresh para el usuario.
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    return str(access), str(refresh)


def validate_refresh_token(raw_token):
    # Valida que el token sea refresh.
    refresh = RefreshToken(raw_token)
    if refresh.get(api_settings.TOKEN_TYPE_CLAIM) != "refresh":
        raise TokenError("Invalid token type")
    return refresh


def decode_access_token(raw_token):
    # Decodifica access token.
    token = AccessToken(raw_token)
    if token.get(api_settings.TOKEN_TYPE_CLAIM) != "access":
        raise TokenError("Invalid token type")
    return token


def create_reset_token(user):
    # Token temporal para el reset de password.
    token = AccessToken.for_user(user)
    token.set_exp(lifetime=timedelta(minutes=10))
    token[api_settings.TOKEN_TYPE_CLAIM] = "reset"
    return str(token)


def decode_reset_token(raw_token):
    # Decodifica token reset y valida tipo.
    token_backend = TokenBackend(
        algorithm=api_settings.ALGORITHM,
        signing_key=settings.SECRET_KEY,
        verifying_key=settings.SECRET_KEY,
    )
    try:
        payload = token_backend.decode(raw_token, verify=True)
    except TokenBackendError as exc:
        raise TokenError(str(exc)) from exc
    if payload.get(api_settings.TOKEN_TYPE_CLAIM) != "reset":
        raise TokenError("Invalid token type")
    return payload


def set_auth_cookies(response, access_token, refresh_token, csrf_token):
    # Set de cookies para sesion autenticada.
    secure = _cookie_secure()
    response.set_cookie(
        ACCESS_COOKIE,
        access_token,
        max_age=ACCESS_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="Lax",
        path="/api",
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=REFRESH_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="Strict",
        path="/api/v1/auth/refresh",
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        max_age=CSRF_MAX_AGE,
        secure=secure,
        samesite="Strict",
        path="/",
    )


def set_csrf_cookie(response, csrf_token):
    # Cookie CSRF (no HttpOnly) leida por el frontend.
    secure = _cookie_secure()
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        max_age=CSRF_MAX_AGE,
        secure=secure,
        samesite="Strict",
        path="/",
    )


def clear_auth_cookies(response):
    # Limpia cookies de sesion.
    secure = _cookie_secure()
    response.set_cookie(
        ACCESS_COOKIE,
        "",
        max_age=0,
        httponly=True,
        secure=secure,
        samesite="Strict",
        path="/api",
    )
    response.set_cookie(
        REFRESH_COOKIE,
        "",
        max_age=0,
        httponly=True,
        secure=secure,
        samesite="Strict",
        path="/api/v1/auth/refresh",
    )
    response.set_cookie(
        CSRF_COOKIE,
        "",
        max_age=0,
        secure=secure,
        samesite="Strict",
        path="/",
    )


def set_reset_cookie(response, reset_token):
    # Cookie temporal para reset password.
    secure = _cookie_secure()
    response.set_cookie(
        RESET_COOKIE,
        reset_token,
        max_age=RESET_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="Strict",
        path="/api/v1/auth/reset-password",
    )


def clear_reset_cookie(response):
    # Limpia cookie temporal de reset.
    secure = _cookie_secure()
    response.set_cookie(
        RESET_COOKIE,
        "",
        max_age=0,
        httponly=True,
        secure=secure,
        samesite="Strict",
        path="/api/v1/auth/reset-password",
    )
