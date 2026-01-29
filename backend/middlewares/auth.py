class JWTAuthenticationMiddleware:
    """Middleware placeholder para futuras validaciones."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Por ahora solo delega la respuesta.
        return self.get_response(request)
