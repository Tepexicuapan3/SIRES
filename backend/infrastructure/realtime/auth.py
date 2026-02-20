from http.cookies import SimpleCookie

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings

from apps.authentication.services.token_service import ACCESS_COOKIE, decode_access_token


async def authenticate_websocket_scope(scope):
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
