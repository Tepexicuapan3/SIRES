from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.serializers import (CompleteOnboardingSerializer,
                                             LoginSerializer,
                                             RequestResetCodeSerializer,
                                             ResetPasswordSerializer,
                                             VerifyResetCodeSerializer)
from apps.authentication.services.audit_service import (log_event, mask_email,
                                                        mask_username)
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import (error_response,
                                                           get_request_id)
from apps.authentication.services.session_service import authenticate_request
from apps.authentication.services.token_service import (REFRESH_COOKIE,
                                                        clear_auth_cookies,
                                                        clear_reset_cookie,
                                                        generate_csrf_token,
                                                        set_auth_cookies,
                                                        set_csrf_cookie,
                                                        set_reset_cookie)
from apps.authentication.uses_case.login_usecase import login_user
from apps.authentication.uses_case.me_usecase import build_me_response
from apps.authentication.uses_case.onboarding_usecase import \
    complete_onboarding
from apps.authentication.uses_case.refresh_usecase import refresh_tokens
from apps.authentication.uses_case.request_reset_code_usecase import \
    request_reset_code
from apps.authentication.uses_case.reset_password_usecase import reset_password
from apps.authentication.uses_case.verify_reset_code_usecase import \
    verify_reset_code
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


def _csrf_or_error(request):
    # Valida CSRF usando cookie y header.
    if validate_csrf(request):
        return None
    return error_response(
        "PERMISSION_DENIED",
        "No tienes permiso para esta acción",
        status.HTTP_403_FORBIDDEN,
        request_id=get_request_id(request),
    )


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            session_user = authenticate_request(request)
        except AuthServiceError:
            session_user = None

        if session_user:
            log_event(
                request,
                "LOGIN_BLOCKED",
                "FAIL",
                actor_user=session_user,
                target_user=session_user,
                error_code="SESSION_ACTIVE",
                meta={"endpoint": "/auth/login"},
            )
            return error_response(
                "SESSION_ACTIVE",
                "Ya existe una sesión activa. Cierra sesión para continuar.",
                status.HTTP_409_CONFLICT,
                request_id=get_request_id(request),
            )

        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            log_event(
                request,
                "LOGIN_FAILED",
                "FAIL",
                error_code="INVALID_CREDENTIALS",
                meta={
                    "endpoint": "/auth/login",
                    "username": mask_username(request.data.get("username")),
                },
            )
            return error_response(
                "INVALID_CREDENTIALS",
                "Usuario o contraseña incorrectos",
                status.HTTP_401_UNAUTHORIZED,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            result = login_user(
                serializer.validated_data["username"],
                serializer.validated_data["password"],
                request.META.get("REMOTE_ADDR"),
            )
        except AuthServiceError as exc:
            user = UserRepository.get_by_username(serializer.validated_data.get("username"))
            log_event(
                request,
                "LOGIN_FAILED",
                "FAIL",
                actor_user=user,
                target_user=user,
                error_code=exc.code,
                meta={
                    "endpoint": "/auth/login",
                    "username": mask_username(serializer.validated_data.get("username")),
                },
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )
        except Exception:
            log_event(
                request,
                "LOGIN_FAILED",
                "FAIL",
                error_code="INTERNAL_SERVER_ERROR",
                meta={"endpoint": "/auth/login"},
            )
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        response_body = {
            "user": result["user"],
            "requiresOnboarding": result["requires_onboarding"],
        }
        response = Response(response_body, status=status.HTTP_200_OK)
        # Genera cookies tras login exitoso.
        csrf_token = generate_csrf_token()
        set_auth_cookies(
            response,
            result["access_token"],
            result["refresh_token"],
            csrf_token,
        )
        log_event(
            request,
            "LOGIN_SUCCESS",
            "SUCCESS",
            actor_user=UserRepository.get_by_username(serializer.validated_data["username"]),
            target_user=UserRepository.get_by_username(serializer.validated_data["username"]),
            meta={
                "endpoint": "/auth/login",
                "username": mask_username(serializer.validated_data.get("username")),
            },
        )
        return response


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            log_event(
                request,
                "LOGOUT",
                "FAIL",
                error_code=exc.code,
                meta={"endpoint": "/auth/logout"},
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            log_event(
                request,
                "LOGOUT",
                "FAIL",
                actor_user=user,
                target_user=user,
                error_code="PERMISSION_DENIED",
                meta={"endpoint": "/auth/logout"},
            )
            return csrf_error

        response = Response(
            {"success": True},
            status=status.HTTP_200_OK,
        )
        # Limpia cookies para cerrar la sesion.
        clear_auth_cookies(response)
        log_event(
            request,
            "LOGOUT",
            "SUCCESS",
            actor_user=user,
            target_user=user,
            meta={"endpoint": "/auth/logout"},
        )
        return response


@method_decorator(csrf_exempt, name="dispatch")
class MeView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            log_event(
                request,
                "SESSION_VALIDATE",
                "FAIL",
                error_code=exc.code,
                meta={"endpoint": "/auth/me"},
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )

        log_event(
            request,
            "SESSION_VALIDATE",
            "SUCCESS",
            actor_user=user,
            target_user=user,
            meta={"endpoint": "/auth/me"},
        )
        return Response(build_me_response(user), status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class VerifyView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            authenticate_request(request)
        except AuthServiceError as exc:
            status_code = (
                status.HTTP_403_FORBIDDEN
                if exc.code == "PERMISSION_DENIED"
                else status.HTTP_401_UNAUTHORIZED
            )
            return Response({"valid": False}, status=status_code)

        return Response({"valid": True}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class RefreshView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh_token:
            log_event(
                request,
                "TOKEN_REFRESH",
                "FAIL",
                error_code="TOKEN_INVALID",
                meta={"endpoint": "/auth/refresh"},
            )
            return error_response(
                "TOKEN_INVALID",
                "Token inválido",
                status.HTTP_401_UNAUTHORIZED,
                request_id=get_request_id(request),
            )

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            log_event(
                request,
                "TOKEN_REFRESH",
                "FAIL",
                error_code="PERMISSION_DENIED",
                meta={"endpoint": "/auth/refresh"},
            )
            return csrf_error

        try:
            result = refresh_tokens(refresh_token)
        except AuthServiceError as exc:
            log_event(
                request,
                "TOKEN_REFRESH",
                "FAIL",
                error_code=exc.code,
                meta={"endpoint": "/auth/refresh"},
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )
        except Exception:
            log_event(
                request,
                "TOKEN_REFRESH",
                "FAIL",
                error_code="INTERNAL_SERVER_ERROR",
                meta={"endpoint": "/auth/refresh"},
            )
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        response = Response({"success": True}, status=status.HTTP_200_OK)
        # Rota tokens al refrescar.
        csrf_token = generate_csrf_token()
        set_auth_cookies(
            response,
            result["access_token"],
            result["refresh_token"],
            csrf_token,
        )
        log_event(
            request,
            "TOKEN_REFRESH",
            "SUCCESS",
            meta={"endpoint": "/auth/refresh"},
        )
        return response


@method_decorator(csrf_exempt, name="dispatch")
class CompleteOnboardingView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            log_event(
                request,
                "ONBOARDING_FAILED",
                "FAIL",
                actor_user=user,
                target_user=user,
                error_code="PERMISSION_DENIED",
                meta={"endpoint": "/auth/complete-onboarding"},
            )
            return csrf_error

        serializer = CompleteOnboardingSerializer(data=request.data)
        if not serializer.is_valid():
            error_code = "PASSWORD_TOO_WEAK"
            message = "La contraseña es demasiado débil"
            if "termsAccepted" in serializer.errors:
                error_code = "TERMS_NOT_ACCEPTED"
                message = "Debes aceptar los términos y condiciones"
            log_event(
                request,
                "ONBOARDING_FAILED",
                "FAIL",
                actor_user=user,
                target_user=user,
                error_code=error_code,
                meta={"endpoint": "/auth/complete-onboarding"},
            )
            return error_response(
                error_code,
                message,
                status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            result = complete_onboarding(
                user,
                serializer.validated_data["newPassword"],
                serializer.validated_data["termsAccepted"],
                request.META.get("REMOTE_ADDR"),
            )
        except AuthServiceError as exc:
            log_event(
                request,
                "ONBOARDING_FAILED",
                "FAIL",
                actor_user=user,
                target_user=user,
                error_code=exc.code,
                meta={"endpoint": "/auth/complete-onboarding"},
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )
        except Exception:
            log_event(
                request,
                "ONBOARDING_FAILED",
                "FAIL",
                actor_user=user,
                target_user=user,
                error_code="ONBOARDING_FAILED",
                meta={"endpoint": "/auth/complete-onboarding"},
            )
            return error_response(
                "ONBOARDING_FAILED",
                "No se pudo completar el onboarding",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        response = Response(
            {
                "user": result["user"],
                "requiresOnboarding": bool(result["user"].get("requiresOnboarding")),
            },
            status=status.HTTP_200_OK,
        )
        # Re-emite tokens al completar onboarding.
        csrf_token = generate_csrf_token()
        set_auth_cookies(
            response,
            result["access_token"],
            result["refresh_token"],
            csrf_token,
        )
        log_event(
            request,
            "ONBOARDING_COMPLETED",
            "SUCCESS",
            actor_user=user,
            target_user=user,
            meta={"endpoint": "/auth/complete-onboarding"},
        )
        return response


@method_decorator(csrf_exempt, name="dispatch")
class RequestResetCodeView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RequestResetCodeSerializer(data=request.data)
        if not serializer.is_valid():
            error_code = "INVALID_EMAIL" if "email" in serializer.errors else "VALIDATION_ERROR"
            message = "Email inválido" if error_code == "INVALID_EMAIL" else "Hay errores en el formulario"
            log_event(
                request,
                "RESET_CODE_REQUESTED",
                "FAIL",
                error_code=error_code,
                meta={
                    "endpoint": "/auth/request-reset-code",
                    "email": mask_email(request.data.get("email")),
                },
            )
            return error_response(
                error_code,
                message,
                status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            user = request_reset_code(serializer.validated_data["email"])
        except AuthServiceError as exc:
            log_event(
                request,
                "RESET_CODE_REQUESTED",
                "FAIL",
                error_code=exc.code,
                meta={
                    "endpoint": "/auth/request-reset-code",
                    "email": mask_email(serializer.validated_data.get("email")),
                },
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )
        except Exception:
            log_event(
                request,
                "RESET_CODE_REQUESTED",
                "FAIL",
                error_code="INTERNAL_SERVER_ERROR",
                meta={"endpoint": "/auth/request-reset-code"},
            )
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        log_event(
            request,
            "RESET_CODE_REQUESTED",
            "SUCCESS",
            actor_user=user,
            target_user=user,
            meta={
                "endpoint": "/auth/request-reset-code",
                "email": mask_email(serializer.validated_data.get("email")),
            },
        )
        return Response({"success": True}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class VerifyResetCodeView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = VerifyResetCodeSerializer(data=request.data)
        if not serializer.is_valid():
            error_code = "INVALID_EMAIL" if "email" in serializer.errors else "INVALID_CODE"
            message = "Email inválido" if error_code == "INVALID_EMAIL" else "Código incorrecto"
            log_event(
                request,
                "RESET_CODE_FAILED",
                "FAIL",
                error_code=error_code,
                meta={
                    "endpoint": "/auth/verify-reset-code",
                    "email": mask_email(request.data.get("email")),
                },
            )
            return error_response(
                error_code,
                message,
                status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        try:
            result = verify_reset_code(
                serializer.validated_data["email"],
                serializer.validated_data["code"],
            )
        except AuthServiceError as exc:
            log_event(
                request,
                "RESET_CODE_FAILED",
                "FAIL",
                error_code=exc.code,
                meta={
                    "endpoint": "/auth/verify-reset-code",
                    "email": mask_email(serializer.validated_data.get("email")),
                },
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )
        except Exception:
            log_event(
                request,
                "RESET_CODE_FAILED",
                "FAIL",
                error_code="INTERNAL_SERVER_ERROR",
                meta={"endpoint": "/auth/verify-reset-code"},
            )
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        response = Response({"valid": True}, status=status.HTTP_200_OK)
        # Token temporal para el reset.
        set_reset_cookie(response, result["reset_token"])
        # CSRF para el siguiente paso (reset-password) que usa cookie.
        set_csrf_cookie(response, generate_csrf_token())
        log_event(
            request,
            "RESET_CODE_VERIFIED",
            "SUCCESS",
            actor_user=result.get("user"),
            target_user=result.get("user"),
            meta={
                "endpoint": "/auth/verify-reset-code",
                "email": mask_email(serializer.validated_data.get("email")),
            },
        )
        return response


@method_decorator(csrf_exempt, name="dispatch")
class ResetPasswordView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            log_event(
                request,
                "PASSWORD_RESET_FAILED",
                "FAIL",
                error_code="PASSWORD_TOO_WEAK",
                meta={"endpoint": "/auth/reset-password"},
            )
            return error_response(
                "PASSWORD_TOO_WEAK",
                "La contraseña es demasiado débil",
                status.HTTP_400_BAD_REQUEST,
                details=serializer.errors,
                request_id=get_request_id(request),
            )

        reset_token = request.COOKIES.get("reset_token")
        if not reset_token:
            log_event(
                request,
                "PASSWORD_RESET_FAILED",
                "FAIL",
                error_code="TOKEN_INVALID",
                meta={"endpoint": "/auth/reset-password"},
            )
            return error_response(
                "TOKEN_INVALID",
                "Token inválido",
                status.HTTP_401_UNAUTHORIZED,
                request_id=get_request_id(request),
            )

        csrf_error = _csrf_or_error(request)
        if csrf_error:
            log_event(
                request,
                "PASSWORD_RESET_FAILED",
                "FAIL",
                error_code="PERMISSION_DENIED",
                meta={"endpoint": "/auth/reset-password"},
            )
            return csrf_error

        try:
            result = reset_password(
                reset_token,
                serializer.validated_data["newPassword"],
                request.META.get("REMOTE_ADDR"),
            )
        except AuthServiceError as exc:
            log_event(
                request,
                "PASSWORD_RESET_FAILED",
                "FAIL",
                error_code=exc.code,
                meta={"endpoint": "/auth/reset-password"},
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=get_request_id(request),
            )
        except Exception:
            log_event(
                request,
                "PASSWORD_RESET_FAILED",
                "FAIL",
                error_code="INTERNAL_SERVER_ERROR",
                meta={"endpoint": "/auth/reset-password"},
            )
            return error_response(
                "INTERNAL_SERVER_ERROR",
                "Error del servidor, intenta nuevamente",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=get_request_id(request),
            )

        response = Response(
            {
                "user": result["user"],
                "requiresOnboarding": bool(result["user"].get("requiresOnboarding")),
            },
            status=status.HTTP_200_OK,
        )
        # Cierra el flujo de reset con nueva sesion.
        csrf_token = generate_csrf_token()
        set_auth_cookies(
            response,
            result["access_token"],
            result["refresh_token"],
            csrf_token,
        )
        # Elimina cookie reset luego del cambio.
        clear_reset_cookie(response)
        log_event(
            request,
            "PASSWORD_RESET_SUCCESS",
            "SUCCESS",
            actor_user=UserRepository.get_by_id(result["user"]["id"]),
            target_user=UserRepository.get_by_id(result["user"]["id"]),
            meta={"endpoint": "/auth/reset-password"},
        )
        return response
