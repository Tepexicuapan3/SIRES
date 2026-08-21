import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigationAPI } from "@api/resources/navigation.api";
import type { CreateModuleRequest } from "@api/types";
import { navigationMenuKeys } from "@features/navigation/queries/navigationMenu.keys";

/**
 * `POST /modules`. Invalida el arbol de navegacion (`menu()`, lo consume
 * el sidebar real) y el catalogo de modulos (`moduleCatalog()`, prefijo
 * que cubre ambas variantes -- con y sin `includeInactive` -- ver
 * `navigationMenuKeys`).
 */
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModuleRequest) => navigationAPI.createModule(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: navigationMenuKeys.menu() });
      void queryClient.invalidateQueries({
        queryKey: navigationMenuKeys.moduleCatalog(),
      });
    },
  });
};
