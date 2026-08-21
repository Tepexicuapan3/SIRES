from django.utils import timezone

from apps.administracion.models import Modulo, ModuloPermiso


class NavigationModuleMutationRepository:
    """
    Escritura de `Modulo`/`ModuloPermiso`. Complementa a
    `NavigationMenuRepository` (lectura): los use cases de este change
    reciben AMBOS repositorios inyectados -- lectura para resolver
    clave/padre/hermanos, escritura para persistir.
    """

    def create_module(self, *, clave, titulo, icono, url, badge, orden, es_seccion, grupo, parent):
        modulo = Modulo(
            clave=clave,
            titulo=titulo,
            icono=icono,
            url=url,
            badge=badge,
            orden=orden,
            es_seccion=es_seccion,
            es_sistema=False,
            grupo=grupo,
            id_parent=parent,
            is_active=True,
        )
        modulo.full_clean()
        modulo.save()
        return modulo

    def update_module(self, modulo, **fields):
        """
        Setea solo los campos presentes en `fields` que realmente cambian,
        corre `full_clean()` (dispara `Modulo.clean()` -- ciclo/profundidad
        de ANCESTROS) y guarda con `update_fields` acotado. Si nada cambio,
        no toca la fila. Lo usan `UpdateModuleUseCase` (campos simples) y
        `MoveModuleUseCase` (`id_parent`).
        """
        update_fields = []
        for field, value in fields.items():
            if getattr(modulo, field) != value:
                setattr(modulo, field, value)
                update_fields.append(field)

        if update_fields:
            modulo.full_clean()
            modulo.fch_modf = timezone.now()
            update_fields.append("fch_modf")
            modulo.save(update_fields=update_fields)
        return modulo

    def hide_module(self, modulo):
        modulo.is_active = False
        modulo.fch_baja = timezone.now()
        modulo.save(update_fields=["is_active", "fch_baja"])
        return modulo

    def restore_module(self, modulo):
        modulo.is_active = True
        modulo.fch_baja = None
        modulo.save(update_fields=["is_active", "fch_baja"])
        return modulo

    def set_permisos(self, modulo, permission_ids):
        """
        Sincroniza `ModuloPermiso` al set exacto `permission_ids` (semantica
        set-replace, igual que `AssignRolePermissionsUseCase` con
        `RelRolPermiso`, pero sin soft-delete: `ModuloPermiso` no tiene
        `fch_baja`, la relacion simplemente se borra/crea).
        """
        existentes = {
            relacion.id_permiso_id: relacion
            for relacion in ModuloPermiso.objects.filter(id_modulo=modulo)
        }
        deseados = set(permission_ids)

        nuevos_ids = deseados - set(existentes.keys())
        for permiso_id in nuevos_ids:
            ModuloPermiso.objects.create(id_modulo=modulo, id_permiso_id=permiso_id)

        obsoletos_ids = set(existentes.keys()) - deseados
        if obsoletos_ids:
            ModuloPermiso.objects.filter(
                id_modulo=modulo, id_permiso_id__in=obsoletos_ids
            ).delete()

        return bool(nuevos_ids or obsoletos_ids)
