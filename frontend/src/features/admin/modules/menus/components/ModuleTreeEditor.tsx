import { useMemo } from "react";
import { toast } from "sonner";
import { ModuleTreeRow } from "@features/admin/modules/menus/components/ModuleTreeRow";
import { useReorderModules } from "@features/admin/modules/menus/mutations/useReorderModules";
import { getModuleErrorMessage } from "@features/admin/modules/menus/utils/menus.feedback";
import type { ModuleCatalogNodeDTO } from "@api/types";

interface ModuleTreeActions {
  canUpdate: boolean;
  canDelete: boolean;
  onEditNode: (node: ModuleCatalogNodeDTO) => void;
  onMoveNode: (node: ModuleCatalogNodeDTO) => void;
  onHideNode: (node: ModuleCatalogNodeDTO, nextIsActive: boolean) => void;
}

interface ModuleTreeEditorProps extends ModuleTreeActions {
  nodes: ModuleCatalogNodeDTO[];
}

/**
 * Arbol editable, recursivo, NO virtualizado (el catalogo completo tiene
 * ~70 nodos -- lejos del umbral donde virtualizar compensa la complejidad).
 *
 * El reordenamiento es por BOTONES (subir/bajar), nunca drag-and-drop --
 * decision de diseño explicita (accesibilidad + simplicidad de
 * implementacion sobre un arbol de esta escala).
 */
export function ModuleTreeEditor({ nodes, ...actions }: ModuleTreeEditorProps) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-struct/70 bg-subtle/20 px-6 py-12 text-center">
        <p className="text-sm font-semibold text-txt-body">
          No hay módulos en el catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <ModuleTreeLevel siblings={nodes} parentKey={null} depth={0} {...actions} />
    </div>
  );
}

interface ModuleTreeLevelProps extends ModuleTreeActions {
  siblings: ModuleCatalogNodeDTO[];
  parentKey: string | null;
  depth: number;
}

function ModuleTreeLevel({
  siblings,
  parentKey,
  depth,
  canUpdate,
  canDelete,
  onEditNode,
  onMoveNode,
  onHideNode,
}: ModuleTreeLevelProps) {
  const reorderModules = useReorderModules();

  // El backend SOLO administra orden entre hermanos ACTIVOS
  // (`NavigationMenuRepository.sibling_ids` filtra `is_active=True`) --
  // un nodo oculto conserva el `orden` que tenia al ocultarse, pero no
  // participa del reordenamiento hasta que se restaura. Por eso "subir"/
  // "bajar" se calculan sobre el subconjunto activo, no sobre `siblings`
  // completo (que aca incluye ocultos porque `MenusPage` pide
  // `includeInactive=true`).
  const activeKeys = useMemo(
    () => siblings.filter((node) => node.isActive).map((node) => node.key),
    [siblings],
  );

  const handleMove = (node: ModuleCatalogNodeDTO, direction: -1 | 1) => {
    const currentIndex = activeKeys.indexOf(node.key);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= activeKeys.length) return;

    const orderedKeys = [...activeKeys];
    const [moved] = orderedKeys.splice(currentIndex, 1);
    orderedKeys.splice(targetIndex, 0, moved);

    reorderModules.mutate(
      { parentKey, orderedKeys },
      {
        onError: (error) => {
          toast.error("No se pudo reordenar", {
            description: getModuleErrorMessage(error, "Error al reordenar"),
          });
        },
      },
    );
  };

  return (
    <>
      {siblings.map((node) => {
        const activeIndex = node.isActive ? activeKeys.indexOf(node.key) : -1;

        return (
          <div key={node.key} className="space-y-1.5">
            <ModuleTreeRow
              node={node}
              depth={depth}
              canMoveUp={activeIndex > 0}
              canMoveDown={activeIndex !== -1 && activeIndex < activeKeys.length - 1}
              canUpdate={canUpdate}
              canDelete={canDelete}
              isBusy={reorderModules.isPending}
              onMoveUp={() => handleMove(node, -1)}
              onMoveDown={() => handleMove(node, 1)}
              onMoveToFolder={() => onMoveNode(node)}
              onEdit={() => onEditNode(node)}
              onToggleVisibility={() => onHideNode(node, !node.isActive)}
            />
            {node.items.length > 0 ? (
              <ModuleTreeLevel
                siblings={node.items}
                parentKey={node.key}
                depth={depth + 1}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onEditNode={onEditNode}
                onMoveNode={onMoveNode}
                onHideNode={onHideNode}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}
