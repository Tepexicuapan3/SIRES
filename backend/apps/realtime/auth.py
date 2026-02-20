from http.cookies import SimpleCookie
from urllib.parse import parse_qs

from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings

from apps.authentication.services.token_service import ACCESS_COOKIE, decode_access_token

REALTIME_USER_SCOPE_KEY = "realtime_user"
REALTIME_QUERY_TOKEN_SCOPE_KEY = "realtime_query_token_present"


class CookieJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        mutable_scope = dict(scope)

        mutable_scope[REALTIME_QUERY_TOKEN_SCOPE_KEY] = has_forbidden_query_token(
            mutable_scope
        )
        if mutable_scope[REALTIME_QUERY_TOKEN_SCOPE_KEY]:
            mutable_scope[REALTIME_USER_SCOPE_KEY] = None
            return await super().__call__(mutable_scope, receive, send)

        mutable_scope[REALTIME_USER_SCOPE_KEY] = authenticate_websocket_scope(
            mutable_scope
        )
        return await super().__call__(mutable_scope, receive, send)


def authenticate_websocket_scope(scope):
    raw_token = extract_cookie_value(scope, ACCESS_COOKIE)
    if not raw_token:
        return None

    try:
        payload = decode_access_token(raw_token)
    except TokenError:
        return None

    user_id = payload.get(api_settings.USER_ID_CLAIM)
    if user_id in (None, ""):
        return None

    return {
        "id": str(user_id),
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
