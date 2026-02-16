from django.db import transaction
from ...models import RelUsuarioRol


class AssignRolesUseCase:

    @staticmethod
    @transaction.atomic
    def execute(usuario, roles, actor):

        for rol in roles:

            rel, created = RelUsuarioRol.objects.get_or_create(
                id_usuario=usuario,
                id_rol=rol,
                defaults={"usr_asignacion": actor},
            )

            if not created and rel.fch_baja:
                rel.fch_baja = None
                rel.usr_baja = None
                rel.save()
