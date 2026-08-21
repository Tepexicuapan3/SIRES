import { useQuery } from "@tanstack/react-query";
import { navigationAPI } from "@api/resources/navigation.api";
import type { ModuleCatalogResponse } from "@api/types/navigation.types";
import { navigationMenuKeys } from "@features/navigation/queries/navigationMenu.keys";

/**
 * Query de `GET /modules` -- catalogo completo de modulos que alimenta la
 * tab "Modulos" del detalle de rol (`RoleDetailsDialog`) y la pantalla de
 * gestion de menus (`MenusPage`, Fase 5).
 *
 * `enabled` lo controla el caller (por defecto `true`): la tab "Modulos"
 * solo se monta/activa cuando el admin la abre, asi que quien la use debe
 * pasar `enabled: activeTab === "modules"` para no disparar el fetch antes
 * de tiempo.
 *
 * `includeInactive` (default `false`) suma los modulos ocultos al arbol y
 * exige `admin:gestion:modulos:read` en vez de `admin:gestion:roles:read`
 * -- solo `MenusPage` lo pasa en `true`, la tab de roles sigue usando el
 * default para no cambiar de permiso de golpe. Si el actor no tiene el
 * permiso requerido, el backend responde 403 y React Query expone el
 * error via `isError`/`error` (el caller decide como mostrarlo).
 */
export function useModuleCatalog(enabled = true, includeInactive = false) {
  return useQuery<ModuleCatalogResponse>({
    queryKey: navigationMenuKeys.moduleCatalog(includeInactive),
    queryFn: () => navigationAPI.getModuleCatalog({ includeInactive }),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
