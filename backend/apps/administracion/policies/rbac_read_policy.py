import uuid

from rest_framework import status

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request


class RbacReadPolicy:
    @staticmethod
    def authorize(request, permission_code):
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
        permissions = UserRepository.build_auth_user(user).get("permissions", [])
        if "*" not in permissions and permission_code not in permissions:
            return user, error_response(
                "PERMISSION_DENIED",
                "No tienes permiso para esta accion",
                status.HTTP_403_FORBIDDEN,
                request_id=request_id,
            )

        return user, None
