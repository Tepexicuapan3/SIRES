"""
Vistas del import masivo de usuarios por Excel (plantilla + preview +
confirmar). Transporte HTTP delgado -- toda la logica de parseo/validacion
vive en `apps.administracion.services.user_import_service` y el alta real en
`apps.administracion.use_cases.users.create_user`/`import_users`.

Reusa los helpers privados de autenticacion/auditoria de `rbac_views.py`
(mismo patron ya usado por `expediente_view.py` y las vistas de
`rbac_role_permission_*`).
"""

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administracion.services.user_import_service import ImportFileError
from apps.administracion.use_cases.users.import_users import (
    ConfirmUsersImportUseCase,
    PreviewUsersImportUseCase,
    RoleVanishedDuringImport,
    TemplateUsersImportUseCase,
)
from apps.administracion.views.rbac_views import _audit, _authorize, _request_id
from apps.authentication.services.response_service import error_response

IMPORT_PERMISSION = "admin:gestion:usuarios:create"


class UserImportTemplateView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        _, auth_error = _authorize(request, IMPORT_PERMISSION)
        if auth_error:
            return auth_error

        content = TemplateUsersImportUseCase().execute()
        filename = f"plantilla_usuarios_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        response = HttpResponse(
            content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class UserImportPreviewView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        _, auth_error = _authorize(request, IMPORT_PERMISSION, require_csrf=True)
        if auth_error:
            _audit(
                request,
                "RBAC_USER_IMPORT_PREVIEW",
                "user",
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        file = request.FILES.get("file")
        if not file:
            return error_response(
                "VALIDATION_ERROR",
                "Archivo requerido",
                status.HTTP_400_BAD_REQUEST,
                details={"file": ["Campo requerido"]},
                request_id=_request_id(request),
            )

        try:
            result = PreviewUsersImportUseCase().execute(file)
        except ImportFileError as exc:
            _audit(
                request,
                "RBAC_USER_IMPORT_PREVIEW",
                "user",
                result="FAIL",
                error_code=exc.code,
            )
            return error_response(
                exc.code,
                exc.message,
                status.HTTP_400_BAD_REQUEST,
                details=exc.details,
                request_id=_request_id(request),
            )

        _audit(
            request,
            "RBAC_USER_IMPORT_PREVIEW",
            "user",
            result="SUCCESS",
            after={
                "totalRecords": result["totalRecords"],
                "totalErrores": result["totalErrores"],
            },
        )
        return Response(result, status=status.HTTP_200_OK)


class UserImportConfirmView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        actor, auth_error = _authorize(request, IMPORT_PERMISSION, require_csrf=True)
        if auth_error:
            _audit(
                request,
                "RBAC_USER_IMPORT_CONFIRM",
                "user",
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        file = request.FILES.get("file")
        if not file:
            return error_response(
                "VALIDATION_ERROR",
                "Archivo requerido",
                status.HTTP_400_BAD_REQUEST,
                details={"file": ["Campo requerido"]},
                request_id=_request_id(request),
            )

        try:
            result = ConfirmUsersImportUseCase().execute(file, actor)
        except ImportFileError as exc:
            _audit(
                request,
                "RBAC_USER_IMPORT_CONFIRM",
                "user",
                result="FAIL",
                error_code=exc.code,
            )
            return error_response(
                exc.code,
                exc.message,
                status.HTTP_400_BAD_REQUEST,
                details=exc.details,
                request_id=_request_id(request),
            )
        except RoleVanishedDuringImport as exc:
            _audit(
                request,
                "RBAC_USER_IMPORT_CONFIRM",
                "user",
                result="FAIL",
                error_code="ROLE_VANISHED",
            )
            return error_response(
                "ROLE_VANISHED",
                (
                    "No se pudo completar el import: el rol de la fila "
                    f"{exc.row_number} ({exc.username}) ya no existe o esta inactivo. "
                    "No se creó ningún usuario."
                ),
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=_request_id(request),
            )

        has_errors = result.pop("has_errors", False)
        if has_errors:
            _audit(
                request,
                "RBAC_USER_IMPORT_CONFIRM",
                "user",
                result="FAIL",
                error_code="IMPORT_HAS_ERRORS",
            )
            return Response(
                {**result, "code": "IMPORT_HAS_ERRORS"},
                status=status.HTTP_409_CONFLICT,
            )

        _audit(
            request,
            "RBAC_USER_IMPORT_CONFIRM",
            "user",
            result="SUCCESS",
            after={
                "inserted": result["inserted"],
                "emailFailures": len(result["emailFailures"]),
            },
        )
        return Response(result, status=status.HTTP_200_OK)
