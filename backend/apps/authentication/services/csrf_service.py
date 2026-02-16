from .token_service import CSRF_COOKIE


def validate_csrf(request):
    # Compara header y cookie CSRF.
    header_token = request.headers.get("X-CSRF-TOKEN")
    cookie_token = request.COOKIES.get(CSRF_COOKIE)
    return bool(header_token and cookie_token and header_token == cookie_token)
