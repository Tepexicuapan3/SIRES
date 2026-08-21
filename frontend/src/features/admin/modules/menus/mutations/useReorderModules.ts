import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigationAPI } from "@api/resources/navigation.api";
import type { ReorderModulesRequest } from "@api/types";
import { navigationMenuKeys } from "@features/navigation/queries/navigationMenu.keys";

/**
 * `PATCH /modules/reorder`. Renumera TODO el grupo de hermanos de
 * `parentKey` (10, 20, 30...) -- `orderedKeys` debe coincidir exactamente
 * con los hermanos activos actuales de ese padre, o el backend responde
 * `VALIDATION_ERROR` (ver `ReorderModuleUseCase`).
 */
export const useReorderModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderModulesRequest) =>
      navigationAPI.reorderModules(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: navigationMenuKeys.menu() });
      void queryClient.invalidateQueries({
        queryKey: navigationMenuKeys.moduleCatalog(),
      });
    },
  });
};
