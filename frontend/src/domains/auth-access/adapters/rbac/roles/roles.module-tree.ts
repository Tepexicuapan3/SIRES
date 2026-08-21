import type { ModuleCatalogNodeDTO, Permission } from "@api/types";

/**
 * Tri-estado real de un nodo del arbol de modulos.
 *
 * NO existe "indeterminate": el checkbox de un nodo representa UNICAMENTE
 * sus permisos propios (`node.permissions`), nunca los de sus hijos -- los
 * permisos no son jerarquicos, asi que "padre tildado => hijos tildados"
 * seria mentira. Cada nivel se tilda por separado.
 *
 * - `"checked"`: el rol tiene AL MENOS UNO de los permisos del nodo.
 * - `"unchecked"`: el nodo tiene permisos administrables, pero el rol no
 *   tiene ninguno.
 * - `"unmanaged"`: el nodo no declara NINGUN permiso propio (27 de los 70
 *   nodos del seed). Es visible para todos los roles y no se administra
 *   desde esta tab -- el checkbox va siempre disabled.
 */
export type ModuleCheckState = "checked" | "unchecked" | "unmanaged";

/** Referencia liviana a un nodo, usada en el indice inverso y en el
 * dialogo de efecto colateral -- no hace falta el nodo completo. */
export interface ModuleRef {
  key: string;
  title: string;
}

/**
 * Calcula el tri-estado de un nodo dado el set de codigos de permiso que
 * el rol tiene actualmente en el draft.
 *
 * Misma semantica OR que aplica el backend al resolver el arbol de
 * navegacion filtrado: alcanza con UN permiso del nodo para considerarlo
 * "checked".
 */
export const getModuleState = (
  node: Pick<ModuleCatalogNodeDTO, "permissions">,
  draftCodes: Set<string>,
): ModuleCheckState => {
  if (node.permissions.length === 0) return "unmanaged";

  return node.permissions.some((code) => draftCodes.has(code))
    ? "checked"
    : "unchecked";
};

/**
 * Recorre el arbol completo UNA vez y arma el indice inverso
 * codigo de permiso -> lista de nodos que lo usan.
 *
 * Es la base de `getCollateralModules`: varios nodos distintos pueden
 * compartir el mismo codigo de permiso (ej. un permiso `:read` usado por
 * un modulo padre y por un submenu hijo), y tildar/destildar ese codigo
 * afecta a TODOS ellos a la vez, no solo al nodo que el admin clickeo.
 *
 * Memoizar el resultado en el caller (el arbol no cambia mientras la tab
 * esta abierta, solo cambia el draft de permisos).
 */
export const buildPermissionModuleIndex = (
  tree: ModuleCatalogNodeDTO[],
): Map<string, ModuleRef[]> => {
  const index = new Map<string, ModuleRef[]>();

  const visit = (node: ModuleCatalogNodeDTO) => {
    const ref: ModuleRef = { key: node.key, title: node.title };

    for (const code of node.permissions) {
      const existing = index.get(code);
      if (existing) {
        existing.push(ref);
      } else {
        index.set(code, [ref]);
      }
    }

    for (const child of node.items) visit(child);
  };

  for (const root of tree) visit(root);

  return index;
};

/**
 * Dada una accion de tildar/destildar `node`, calcula que OTROS nodos se
 * verian afectados: los que comparten al menos uno de los codigos de
 * permiso propios de `node`, excluyendo al propio `node`.
 *
 * Alimenta `ModuleImpactDialog`: si el resultado es vacio, la mutacion del
 * draft es directa; si no, hay que confirmar antes.
 */
export const getCollateralModules = (
  node: Pick<ModuleCatalogNodeDTO, "key" | "permissions">,
  index: Map<string, ModuleRef[]>,
): ModuleRef[] => {
  const collateral = new Map<string, ModuleRef>();

  for (const code of node.permissions) {
    const refs = index.get(code) ?? [];
    for (const ref of refs) {
      if (ref.key === node.key) continue;
      collateral.set(ref.key, ref);
    }
  }

  return [...collateral.values()];
};

/** Resultado de resolver codigos de permiso de un nodo contra el catalogo
 * de permisos (code -> id). */
export interface ResolveNodePermissionIdsResult {
  ids: number[];
  /** Codigos del nodo que no aparecen en el catalogo -- indica catalogo
   * desactualizado/stale respecto del arbol de modulos. No deberia pasar
   * en operacion normal, pero el caller debe poder detectarlo en vez de
   * fallar en silencio. */
  missingCodes: string[];
}

/**
 * Traduce los codigos de permiso de un nodo a sus ids, usando el catalogo
 * ya cargado (`usePermissionsCatalog`, el mismo que usa
 * `RoleDetailsPermissionsTab`/`roles.details-draft.ts`).
 *
 * Hace falta porque el arbol de modulos viaja con CODIGOS (`permissions:
 * string[]`) pero `POST /permissions/assign` necesita IDS -- el catalogo
 * de permisos es la unica fuente que conoce el mapeo code -> id.
 */
export const resolveNodePermissionIds = (
  node: Pick<ModuleCatalogNodeDTO, "permissions">,
  catalog: Permission[],
): ResolveNodePermissionIdsResult => {
  const codeToId = new Map(
    catalog.map((permission) => [permission.code, permission.id]),
  );

  const ids: number[] = [];
  const missingCodes: string[] = [];

  for (const code of node.permissions) {
    const id = codeToId.get(code);
    if (id === undefined) {
      missingCodes.push(code);
    } else {
      ids.push(id);
    }
  }

  return { ids, missingCodes };
};
