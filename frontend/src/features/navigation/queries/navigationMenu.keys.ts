/**
 * Query keys de navegacion.
 *
 * `SidebarBreadcrumbs`, `ModuleSearch` y `AppSidebar` (via `useNavigation`)
 * comparten esta MISMA key -- TanStack Query dedupea el fetch entre los
 * tres, un solo request por `staleTime` aunque monten simultaneo.
 */
export const navigationMenuKeys = {
  all: ["navigation"] as const,
  menu: () => [...navigationMenuKeys.all, "menu"] as const,
  /** `GET /modules` -- catalogo completo consumido por la tab "Modulos"
   * del detalle de rol Y por la pantalla de gestion de menus (Fase 5).
   * Cache independiente de `menu()`: distinto payload, distinto permiso
   * de acceso.
   *
   * Sin argumento (`moduleCatalog()`) es la MISMA key que ya usaba la tab
   * "Modulos" -- no se le agrega el booleano por default para no invalidar
   * ese cache compartido, y sirve ademas como PREFIJO: TanStack Query
   * matchea por defecto cualquier key que empiece igual, asi que
   * `invalidateQueries({ queryKey: moduleCatalogKeys.moduleCatalog() })`
   * invalida tanto esta variante como `moduleCatalog(true)` en un solo
   * llamado (lo usan las mutaciones de Fase 5: crear/editar/ocultar/
   * reordenar un modulo). `moduleCatalog(true)` (gestion de menus, incluye
   * ocultos) vive en su propia entrada de cache, mas especifica. */
  moduleCatalog: (includeInactive?: boolean) =>
    includeInactive
      ? ([...navigationMenuKeys.all, "module-catalog", { includeInactive }] as const)
      : ([...navigationMenuKeys.all, "module-catalog"] as const),
};
