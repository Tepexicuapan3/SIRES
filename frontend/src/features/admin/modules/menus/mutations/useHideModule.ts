import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigationAPI } from "@api/resources/navigation.api";
import { navigationMenuKeys } from "@features/navigation/queries/navigationMenu.keys";

interface HideModulePayload {
  clave: string;
  /** `false` oculta (soft delete), `true` restaura -- un solo endpoint
   * para las dos direcciones, ver `ModuleVisibilityView` en el backend.
   * NUNCA hay un "eliminar" real: "Ocultar del menu" es la unica accion
   * destructiva que expone la UI. */
  isActive: boolean;
}

/**
 * `PATCH /modules/{clave}/visibility`.
 */
export const useHideModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clave, isActive }: HideModulePayload) =>
      navigationAPI.setModuleVisibility(clave, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: navigationMenuKeys.menu() });
      void queryClient.invalidateQueries({
        queryKey: navigationMenuKeys.moduleCatalog(),
      });
    },
  });
};
