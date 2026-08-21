import uuid

from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request


class NavigationMenuPolicy:
    """
    Politica del menu de navegacion: solo exige autenticacion, sin permiso
    especifico. El filtrado por permisos efectivos ES el contenido de la
    respuesta (cada usuario logueado tiene un menu, aunque sea vacio).
    """

    @staticmethod
    def authorize(request):
        request_id = str(uuid.uuid4())
        if hasattr(request, "headers"):
            request_id = get_request_id(request) or request_id

        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            return None, error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=request_id,
            )

        request.user = user
        request.request_id = request_id
        return user, None
