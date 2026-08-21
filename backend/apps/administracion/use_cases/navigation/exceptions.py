from rest_framework import status


class NavigationModuleError(Exception):
    """
    Excepcion base de la escritura de `Modulo` (crear/editar/ocultar/mover/
    reordenar). Calca la forma de `RbacRoleMutationError`: las views
    atrapan esta clase (no cada subtipo) y usan `code`/`message`/
    `status_code`/`details` para construir la respuesta de error.
    """

    def __init__(self, code, message, status_code, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class NavigationModuleValidationError(NavigationModuleError):
    def __init__(self, details):
        super().__init__(
            "VALIDATION_ERROR",
            "Datos de entrada invalidos",
            status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class NavigationModuleNotFoundError(NavigationModuleError):
    """
    `field` distingue si lo que no se encontro fue el modulo objetivo
    (`clave`, el default) o el padre destino de un create/move (`parentKey`)
    -- mismo codigo de error, distinto detalle para que el frontend sepa
    que campo del formulario marcar.
    """

    def __init__(self, *, clave, field="clave"):
        super().__init__(
            "MODULE_NOT_FOUND",
            "Modulo no encontrado",
            status.HTTP_404_NOT_FOUND,
            details={field: clave},
        )


class NavigationModuleSystemProtectedError(NavigationModuleError):
    def __init__(self, *, clave):
        super().__init__(
            "MODULE_SYSTEM_PROTECTED",
            "El modulo de sistema no puede ocultarse ni moverse",
            status.HTTP_403_FORBIDDEN,
            details={"clave": clave},
        )


class NavigationPermissionNotFoundError(NavigationModuleError):
    def __init__(self, codes):
        super().__init__(
            "PERMISSION_NOT_FOUND",
            "Uno o mas codigos de permiso no existen o estan inactivos",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"permissionCodes": sorted(codes)},
        )


class NavigationPermissionGrantNotAllowedError(NavigationModuleError):
    def __init__(self, codes):
        super().__init__(
            "PERMISSION_GRANT_NOT_ALLOWED",
            "No puedes asignar permisos que no tienes",
            status.HTTP_403_FORBIDDEN,
            details={"permissionCodes": sorted(codes)},
        )


class NavigationModuleMoveInvalidError(NavigationModuleError):
    def __init__(self, message, details=None):
        super().__init__(
            "MODULE_MOVE_INVALID",
            message,
            status.HTTP_400_BAD_REQUEST,
            details=details,
        )


def details_from_validation_error(exc):
    """
    Traduce un `django.core.exceptions.ValidationError` (levantado por
    `Modulo.full_clean()` o por `NavigationTreeValidator`) al formato de
    `details` que consumen las excepciones de este modulo: `dict` campo ->
    lista de mensajes.
    """
    if hasattr(exc, "message_dict"):
        return exc.message_dict
    return {"__all__": list(exc.messages)}
