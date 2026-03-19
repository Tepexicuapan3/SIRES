from http.cookies import SimpleCookie
from typing import cast
from urllib.parse import parse_qs, urlparse

from channels.middleware import BaseMiddleware
from django.conf import settings
from django.http.request import validate_host
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings

from apps.authentication.services.token_service import ACCESS_COOKIE, decode_access_token

REALTIME_USER_SCOPE_KEY = "realtime_user"
REALTIME_QUERY_TOKEN_SCOPE_KEY = "realtime_query_token_present"


class CookieJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        scope[REALTIME_QUERY_TOKEN_SCOPE_KEY] = has_forbidden_query_token(scope)
        if scope[REALTIME_QUERY_TOKEN_SCOPE_KEY]:
            scope[REALTIME_USER_SCOPE_KEY] = None
            return await super().__call__(scope, receive, send)

        scope[REALTIME_USER_SCOPE_KEY] = await authenticate_websocket_scope(scope)
        return await super().__call__(scope, receive, send)


async def authenticate_websocket_scope(scope):
    if not is_origin_allowed(scope):
        return None

    raw_token = extract_cookie_value(scope, ACCESS_COOKIE)
    if not raw_token:
        return None

    try:
        payload = decode_access_token(raw_token)
    except TokenError:
        return None

    user_id_claim = cast(str, api_settings.USER_ID_CLAIM)
    user_id = payload.get(user_id_claim)
    if user_id in (None, ""):
        return None

    roles = payload.get("roles") or []
    permissions = payload.get("permissions") or []
    return {
        "id": str(user_id),
        "roles": roles,
        "permissions": permissions,
    }


def has_forbidden_query_token(scope):
    raw_query = scope.get("query_string", b"")
    if not raw_query:
        return False

    parsed_query = parse_qs(raw_query.decode("utf-8"), keep_blank_values=True)
    for key in parsed_query:
        lower_key = key.lower()
        if "token" in lower_key:
            return True

    return False


def is_origin_allowed(scope):
    if getattr(settings, "WS_ALLOW_ALL_ORIGINS", False):
        return True

    if getattr(settings, "DEBUG", False) and getattr(
        settings, "ALLOW_ALL_HOSTS", False
    ):
        return True

    origin = extract_header(scope, b"origin")
    if not origin:
        return False

    allowed_origins = getattr(settings, "WS_ALLOWED_ORIGINS", [])
    if allowed_origins:
        return origin in allowed_origins

    allowed_hosts = getattr(settings, "ALLOWED_HOSTS", [])
    origin_host = extract_origin_host(origin)
    if not origin_host:
        return False

    return validate_host(origin_host, allowed_hosts)


def extract_origin_host(origin):
    parsed_origin = urlparse(origin)
    return parsed_origin.hostname


def extract_header(scope, header_name):
    target = header_name.lower()
    for key, value in scope.get("headers", []):
        if key.lower() == target:
            return value.decode("latin-1")
    return None


def extract_cookie_value(scope, cookie_name):
    raw_cookie = extract_header(scope, b"cookie")
    if not raw_cookie:
        return None

    parsed_cookie = SimpleCookie()
    parsed_cookie.load(raw_cookie)
    morsel = parsed_cookie.get(cookie_name)
    if morsel is None:
        return None

    return morsel.value
