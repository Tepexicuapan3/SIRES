import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { useHideModule } from "@features/admin/modules/menus/mutations/useHideModule";
import { getModuleErrorMessage } from "@features/admin/modules/menus/utils/menus.feedback";
import type { ModuleCatalogNodeDTO } from "@api/types";

interface HideModuleDialogProps {
  node: ModuleCatalogNodeDTO | null;
  /** `false` => se va a OCULTAR (soft delete); `true` => se va a
   * RESTAURAR. Determina si se calcula la cascada y el texto del dialogo. */
  nextIsActive: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SubtreeSummary {
  descendants: ModuleCatalogNodeDTO[];
  protectedNode: ModuleCatalogNodeDTO | null;
}

/** Recorre el subarbol de `node` (sin incluirlo) y junta TODOS los
 * descendientes -- lo usa el preview de cascada al ocultar. Tambien
 * detecta si CUALQUIERA de ellos (o el propio nodo) es `es_sistema`, en
 * cuyo caso el backend va a rechazar la operacion (`HideModuleUseCase`
 * bloquea el subarbol completo, no solo el nodo objetivo). */
function summarizeSubtree(node: ModuleCatalogNodeDTO): SubtreeSummary {
  const descendants: ModuleCatalogNodeDTO[] = [];
  let protectedNode: ModuleCatalogNodeDTO | null = node.isSystem ? node : null;

  const visit = (current: ModuleCatalogNodeDTO) => {
    for (const child of current.items) {
      descendants.push(child);
      if (!protectedNode && child.isSystem) protectedNode = child;
      visit(child);
    }
  };
  visit(node);

  return { descendants, protectedNode };
}

/**
 * Confirma ocultar (soft delete, "Ocultar del menú") o restaurar un
 * modulo. NUNCA hay un boton de "Eliminar" real en toda la pantalla de
 * gestion de menus -- ocultar es reversible (`is_active=False`), la FK
 * `id_parent` es `PROTECT` en el modelo.
 *
 * Al ocultar, enumera la cascada (todos los descendientes se ocultan con
 * el) y bloquea la confirmacion si el subarbol contiene un nodo
 * `es_sistema=True` -- mismo invariante que valida el backend
 * (`HideModuleUseCase`), verificado aca del lado cliente para no obligar
 * a un roundtrip fallido solo para mostrar el motivo.
 */
export function HideModuleDialog({
  node,
  nextIsActive,
  open,
  onOpenChange,
}: HideModuleDialogProps) {
  const hideModule = useHideModule();

  if (!node) return null;

  const { descendants, protectedNode } = nextIsActive
    ? { descendants: [], protectedNode: null }
    : summarizeSubtree(node);
  const isBlocked = protectedNode !== null;

  const handleConfirm = async () => {
    try {
      await hideModule.mutateAsync({ clave: node.key, isActive: nextIsActive });
      toast.success(nextIsActive ? "Módulo restaurado" : "Módulo oculto", {
        description: `${node.title} ${nextIsActive ? "vuelve a ser visible" : "se ocultó"} en el menú.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(
        nextIsActive ? "No se pudo restaurar" : "No se pudo ocultar",
        {
          description: getModuleErrorMessage(
            error,
            "Error al actualizar la visibilidad",
          ),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {nextIsActive ? "Restaurar módulo" : "Ocultar módulo del menú"}
          </DialogTitle>
          <DialogDescription>
            {nextIsActive
              ? `«${node.title}» vuelve a mostrarse en el menú de navegación para quien tenga sus permisos.`
              : `«${node.title}» deja de mostrarse en el menú. Podés restaurarlo en cualquier momento -- esto NO elimina el módulo ni sus permisos.`}
          </DialogDescription>
        </DialogHeader>

        {!nextIsActive && descendants.length > 0 ? (
          <div className="space-y-1.5 rounded-lg border border-line-struct/60 bg-subtle/20 p-3">
            <p className="text-xs font-semibold text-txt-body">
              Se ocultan {descendants.length} módulo(s) más junto con este:
            </p>
            <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-txt-muted">
              {descendants.map((descendant) => (
                <li key={descendant.key}>• {descendant.title}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {isBlocked ? (
          <div className="rounded-lg border border-status-critical/30 bg-status-critical/5 px-3 py-2 text-xs text-status-critical">
            No se puede ocultar: «{protectedNode?.title}» es un módulo de
            sistema y no puede quedar oculto, ni siquiera como consecuencia
            de ocultar una carpeta que lo contiene.
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={nextIsActive ? "default" : "destructive"}
            onClick={() => void handleConfirm()}
            disabled={isBlocked || hideModule.isPending}
          >
            {nextIsActive ? "Restaurar" : "Ocultar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
