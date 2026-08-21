import { useQuery } from "@tanstack/react-query";
import { navigationAPI } from "@api/resources/navigation.api";
import type { NavigationMenuResponse } from "@api/types/navigation.types";
import { useAuthSession } from "@/domains/auth-access/contracts/navigation-auth";
import { navigationMenuKeys } from "@features/navigation/queries/navigationMenu.keys";

/**
 * Query de `GET /navigation-menu`.
 *
 * NO usa `createCatalogListHook`: ese factory esta pensado para catalogos
 * paginados del admin (misma forma `{items,total}` + params de filtro);
 * este endpoint devuelve un arbol completo sin paginacion ni params.
 *
 * `enabled: Boolean(user)` evita pedir el menu antes de tener sesion --
 * `useNavigation` ya corta antes (retorna vacio) cuando no hay usuario,
 * pero el guard queda aca tambien por si se usa este hook standalone.
 */
export function useNavigationMenu() {
  const { data: user } = useAuthSession();

  return useQuery<NavigationMenuResponse>({
    queryKey: navigationMenuKeys.menu(),
    queryFn: navigationAPI.getMenu,
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
