import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { flattenModuleFolders } from "@features/admin/modules/menus/domain/flattenModuleFolders";
import { useUpdateModule } from "@features/admin/modules/menus/mutations/useUpdateModule";
import { getModuleErrorMessage } from "@features/admin/modules/menus/utils/menus.feedback";
import type { ModuleCatalogNodeDTO } from "@api/types";

/** Sentinel de Radix Select (no acepta `value=""`) para representar "mover
 * a raiz" (`parentKey: null`). */
const ROOT_VALUE = "__root__";

interface MoveToFolderDialogProps {
  node: ModuleCatalogNodeDTO | null;
  /** Arbol COMPLETO (no solo el nivel de `node`) -- hace falta para
   * aplanar todas las carpetas candidatas, no solo las hermanas. */
  allNodes: ModuleCatalogNodeDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mueve UN modulo existente a otra carpeta (o a la raiz). Nunca se ofrece
 * para nodos `es_sistema=True` -- `ModuleTreeRow` ya deshabilita el boton
 * que abre este dialogo, pero se repite la guarda aca por si se invoca
 * por otro camino.
 */
export function MoveToFolderDialog({
  node,
  allNodes,
  open,
  onOpenChange,
}: MoveToFolderDialogProps) {
  const [selectedParentKey, setSelectedParentKey] = useState<string>(ROOT_VALUE);
  // Recuerda de que nodo vino el ultimo preset -- permite "ajustar estado
  // durante el render" (patron documentado de React) en vez de un
  // `useEffect` que dispare `setState` de forma sincronica al abrir el
  // dialogo para un nodo distinto.
  const [presetForKey, setPresetForKey] = useState<string | null>(null);
  const updateModule = useUpdateModule();

  if (node && node.key !== presetForKey) {
    setPresetForKey(node.key);
    setSelectedParentKey(node.parentKey ?? ROOT_VALUE);
  }

  if (!node) return null;

  const folderOptions = flattenModuleFolders(allNodes, {
    excludeSubtreeOf: node.key,
  });

  const currentParentKey = node.parentKey ?? ROOT_VALUE;
  const hasChanged = selectedParentKey !== currentParentKey;

  const handleConfirm = async () => {
    const nextParentKey =
      selectedParentKey === ROOT_VALUE ? null : selectedParentKey;

    try {
      await updateModule.mutateAsync({
        clave: node.key,
        data: { parentKey: nextParentKey },
      });
      toast.success("Módulo movido", {
        description: `${node.title} se movió correctamente.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo mover el módulo", {
        description: getModuleErrorMessage(error, "Error al mover el módulo"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover a otra carpeta</DialogTitle>
          <DialogDescription>
            Elige a qué carpeta se cambia «{node.title}». Se agrega al final
            de esa carpeta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Select value={selectedParentKey} onValueChange={setSelectedParentKey}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige una carpeta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROOT_VALUE}>
                — Nivel principal (sin carpeta) —
              </SelectItem>
              {folderOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {"  ".repeat(option.depth)}
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            onClick={() => void handleConfirm()}
            disabled={!hasChanged || updateModule.isPending}
          >
            Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
