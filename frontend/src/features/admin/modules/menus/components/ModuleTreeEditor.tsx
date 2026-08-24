import { useMemo, useState } from "react";
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
  /** Con busqueda activa, se ignora el colapso manual y se muestra todo
   * expandido -- si no, un resultado que matchea dentro de una carpeta
   * colapsada quedaria invisible. */
  searchActive?: boolean;
}

const collectFolderKeys = (nodes: ModuleCatalogNodeDTO[]): string[] => {
  const keys: string[] = [];
  const visit = (node: ModuleCatalogNodeDTO) => {
    if (node.items.length > 0) keys.push(node.key);
    for (const child of node.items) visit(child);
  };
  for (const node of nodes) visit(node);
  return keys;
};

/**
 * Arbol editable, recursivo, NO virtualizado (el catalogo completo tiene
 * ~70 nodos -- lejos del umbral donde virtualizar compensa la complejidad).
 *
 * El reordenamiento es por BOTONES (subir/bajar), nunca drag-and-drop --
 * decision de diseño explicita (accesibilidad + simplicidad de
 * implementacion sobre un arbol de esta escala).
 *
 * Las carpetas arrancan COLAPSADAS (solo se ven los menus principales) --
 * el estado de expansion vive aca, no en la URL ni el server, se pierde al
 * recargar la pagina a proposito (es una preferencia de sesion, no un dato
 * de negocio).
 */
export function ModuleTreeEditor({
  nodes,
  searchActive = false,
  ...actions
}: ModuleTreeEditorProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleExpand = (key: string) => {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const folderKeys = useMemo(() => collectFolderKeys(nodes), [nodes]);

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
      {folderKeys.length > 0 ? (
        <div className="flex justify-end gap-4 px-1 text-xs">
          <button
            type="button"
            className="text-txt-muted hover:text-txt-body"
            onClick={() => setExpandedKeys(new Set(folderKeys))}
          >
            Expandir todo
          </button>
          <button
            type="button"
            className="text-txt-muted hover:text-txt-body"
            onClick={() => setExpandedKeys(new Set())}
          >
            Contraer todo
          </button>
        </div>
      ) : null}
      <ModuleTreeLevel
        siblings={nodes}
        parentKey={null}
        depth={0}
        expandedKeys={expandedKeys}
        onToggleExpand={toggleExpand}
        forceExpanded={searchActive}
        {...actions}
      />
    </div>
  );
}

interface ModuleTreeLevelProps extends ModuleTreeActions {
  siblings: ModuleCatalogNodeDTO[];
  parentKey: string | null;
  depth: number;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  forceExpanded: boolean;
}

function ModuleTreeLevel({
  siblings,
  parentKey,
  depth,
  expandedKeys,
  onToggleExpand,
  forceExpanded,
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
        const isExpanded = forceExpanded || expandedKeys.has(node.key);

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
              isExpanded={isExpanded}
              onToggleExpand={() => onToggleExpand(node.key)}
              onMoveUp={() => handleMove(node, -1)}
              onMoveDown={() => handleMove(node, 1)}
              onMoveToFolder={() => onMoveNode(node)}
              onEdit={() => onEditNode(node)}
              onToggleVisibility={() => onHideNode(node, !node.isActive)}
            />
            {node.items.length > 0 && isExpanded ? (
              <ModuleTreeLevel
                siblings={node.items}
                parentKey={node.key}
                depth={depth + 1}
                expandedKeys={expandedKeys}
                onToggleExpand={onToggleExpand}
                forceExpanded={forceExpanded}
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
