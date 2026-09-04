"""
Casos de uso del import masivo de usuarios por Excel (plantilla + preview +
confirmar). Ver `apps/administracion/services/user_import_service.py` para el
parseo/validacion del archivo y
`apps/administracion/use_cases/users/create_user.py` para el alta real de
cada usuario (reusado fila por fila, igual que en el alta individual de
`UsersListCreateView.post`).
"""

from django.conf import settings
from django.db import transaction

from apps.administracion.services.user_import_service import (
    build_template,
    parse_and_validate,
)
from apps.catalogos.models import Roles

from .create_user import CreateUserData, CreateUserUseCase


class EmailDeliveryFailedDuringImport(Exception):
    """
    Se lanza dentro de la transaccion atomica del confirm cuando una fila
    con correo falla al enviar credenciales y
    `settings.ALLOW_USER_CREATE_WITHOUT_EMAIL` es False -- fuerza el
    rollback de TODO el import (todo-o-nada), igual que en el alta
    individual.
    """

    def __init__(self, row_number: int, username: str):
        self.row_number = row_number
        self.username = username
        super().__init__(
            f"Fallo el envio de credenciales para la fila {row_number} ({username})."
        )


class RoleVanishedDuringImport(Exception):
    """
    Se lanza si un rol validado en `parse_and_validate` deja de existir/estar
    activo en el instante de crear el usuario dentro de la transaccion
    (carrera muy improbable, pero preferimos abortar todo el import antes
    que crear un usuario sin rol).
    """

    def __init__(self, row_number: int, username: str):
        self.row_number = row_number
        self.username = username
        super().__init__(
            f"El rol de la fila {row_number} ({username}) ya no existe o esta inactivo."
        )


class TemplateUsersImportUseCase:
    def execute(self) -> bytes:
        return build_template()


class PreviewUsersImportUseCase:
    """Paso 1: valida el Excel y devuelve las filas con error. NO escribe en la BD."""

    def execute(self, file) -> dict:
        result = parse_and_validate(file)
        return {
            "totalRecords": result["total_records"],
            "totalErrores": result["total_errores"],
            "inserted": 0,
            "rows": result["rows"],
        }


class ConfirmUsersImportUseCase:
    """
    Paso 2: recibe el MISMO archivo (nunca filas ya validadas por el
    cliente) y re-corre `parse_and_validate` como unica autoridad.
    Todo-o-nada: si queda un solo error de validacion, no se crea ningun
    usuario. Si todas las filas son validas, crea todos los usuarios dentro
    de una unica transaccion atomica -- si el envio de credenciales de
    alguna fila con correo falla (y el flag de tolerancia esta apagado), se
    revierte TODO el import.
    """

    def execute(self, file, actor) -> dict:
        result = parse_and_validate(file)

        if result["total_errores"] > 0:
            return {
                "totalRecords": result["total_records"],
                "totalErrores": result["total_errores"],
                "inserted": 0,
                "rows": result["rows"],
                "has_errors": True,
            }

        inserted = self._create_all(result["rows"], actor)
        return {
            "totalRecords": result["total_records"],
            "totalErrores": 0,
            "inserted": inserted,
            "rows": result["rows"],
            "has_errors": False,
        }

    @transaction.atomic
    def _create_all(self, rows, actor) -> int:
        inserted = 0
        for row in rows:
            data = row["data"]
            role = Roles.objects.filter(id_rol=data["roleId"], is_active=True).first()
            # `role` ya se valido en parse_and_validate; si desaparecio entre
            # preview y confirm (carrera improbable) fallamos duro para no
            # crear un usuario sin rol.
            if role is None:
                raise RoleVanishedDuringImport(row["row"], data["username"])

            create_result = CreateUserUseCase.execute(
                CreateUserData(
                    username=data["username"],
                    first_name=data["firstName"],
                    paternal_name=data["paternalName"],
                    maternal_name=data["maternalName"] or "",
                    email=data["email"],
                    role=role,
                    actor=actor,
                    no_exp=data["noExp"],
                    est_activo=data["isActive"],
                )
            )

            if (
                create_result.credentials_email_sent is False
                and not settings.ALLOW_USER_CREATE_WITHOUT_EMAIL
            ):
                raise EmailDeliveryFailedDuringImport(row["row"], data["username"])

            inserted += 1

        return inserted
