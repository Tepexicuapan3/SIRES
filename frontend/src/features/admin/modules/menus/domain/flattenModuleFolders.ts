import type { ModuleCatalogNodeDTO } from "@api/types";

/** Opcion aplanada de carpeta destino -- alimenta tanto el Paso 3 del
 * `ModuleCreateWizard` (ubicacion de un modulo nuevo) como
 * `MoveToFolderDialog` (mover uno existente). */
export interface ModuleFolderOption {
  key: string;
  title: string;
  /** Profundidad en el arbol (raiz = 0) -- se usa para indentar la opcion
   * en el selector, asi el admin ve la jerarquia real. */
  depth: number;
  isSystem: boolean;
}

/**
 * Aplana el arbol de `ModuleCatalogNodeDTO` a la lista de carpetas
 * (`isSection === true`) candidatas a ser padre de otro modulo, en orden
 * de recorrido depth-first (mismo orden visual que `ModuleTreeEditor`).
 *
 * `excludeSubtreeOf`, si se pasa, descarta el nodo con esa clave Y TODO su
 * subarbol -- evita que `MoveToFolderDialog` ofrezca mover un nodo dentro
 * de si mismo o de un descendiente propio (ciclo que el backend igual
 * rechaza via `NavigationTreeValidator`, pero conviene no ofrecerlo en la
 * UI en primer lugar).
 */
export function flattenModuleFolders(
  nodes: ModuleCatalogNodeDTO[],
  options?: { excludeSubtreeOf?: string | null },
): ModuleFolderOption[] {
  const excludeKey = options?.excludeSubtreeOf ?? null;
  const result: ModuleFolderOption[] = [];

  const visit = (node: ModuleCatalogNodeDTO, depth: number) => {
    if (excludeKey && node.key === excludeKey) return;

    if (node.isSection) {
      result.push({
        key: node.key,
        title: node.title,
        depth,
        isSystem: node.isSystem,
      });
    }

    for (const child of node.items) visit(child, depth + 1);
  };

  for (const root of nodes) visit(root, 0);

  return result;
}
