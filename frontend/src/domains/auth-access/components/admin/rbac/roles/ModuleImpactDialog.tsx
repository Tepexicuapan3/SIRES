import { Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import type { ModuleRef } from "@/domains/auth-access/adapters/rbac/roles/roles.module-tree";

/**
 * Sentido del tick que dispara el dialogo: `"check"` (el admin esta
 * tildando el nodo) o `"uncheck"` (lo esta destildando). El copy cambia
 * segun el sentido -- ver `roles.module-tree.ts#getCollateralModules`.
 */
export type ModuleImpactAction = "check" | "uncheck";

interface ModuleImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ModuleImpactAction;
  nodeTitle: string;
  collateralModules: ModuleRef[];
  onConfirm: () => void;
}

/**
 * Confirma el efecto colateral de tildar/destildar un nodo del arbol de
 * modulos ANTES de mutar el draft local del rol.
 *
 * Varios nodos del arbol pueden compartir el mismo codigo de permiso (ej.
 * un permiso `:read` usado por un modulo padre y por un submenu hijo) --
 * `getCollateralModules` calcula esos "otros" nodos afectados. Si la lista
 * viene vacia el caller nunca abre este dialogo (mutacion directa).
 *
 * Cancelar es un no-op real: el draft nunca se toco antes de confirmar, asi
 * que no hace falta revertir nada -- el checkbox del nodo simplemente queda
 * como estaba.
 */
export function ModuleImpactDialog({
  open,
  onOpenChange,
  action,
  nodeTitle,
  collateralModules,
  onConfirm,
}: ModuleImpactDialogProps) {
  const moduleList = collateralModules
    .map((module) => module.title)
    .join(", ");

  const description =
    action === "check"
      ? `Este cambio también hará visibles: ${moduleList}. ¿Confirmás el cambio?`
      : `Este cambio también ocultará: ${moduleList}. ¿Confirmás guardar?`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        className="overflow-hidden rounded-2xl border-line-struct/60 bg-paper p-0 shadow-modal data-[size=sm]:max-w-sm"
      >
        <AlertDialogHeader className="px-6 pt-6 pb-5 sm:!place-items-center sm:!text-center">
          <span className="inline-flex size-10 self-center items-center justify-center rounded-full bg-status-info/10 text-status-info">
            <Info className="size-5" />
          </span>
          <AlertDialogTitle className="text-base">
            Efecto colateral en &quot;{nodeTitle}&quot;
          </AlertDialogTitle>
          <AlertDialogDescription className="max-w-sm text-center text-txt-muted">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="!grid !grid-cols-2 gap-3 border-t border-line-struct/60 bg-subtle/30 px-4 py-4 sm:!grid sm:!grid-cols-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 w-full rounded-xl border-line-struct/70 bg-subtle/60 hover:bg-subtle">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction className="w-full rounded-xl" onClick={onConfirm}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
