from django.db import transaction
from catalogos.models import CatRol
from ...services.audit_service import AuditService
from ...constants.rbac_actions import RBACActions


class CreateRoleUseCase:

    @staticmethod
    @transaction.atomic
    def execute(request, data):

        role = CatRol.objects.create(
            rol=data["name"],
            desc_rol=data.get("description"),
            usr_alta=request.user,
        )

        AuditService.log_event(
            request=request,
            accion=RBACActions.ROLE_CREATE,
            recurso_tipo="role",
            recurso_id=role.id_rol,
            datos_despues={"name": role.rol},
        )

        return role
