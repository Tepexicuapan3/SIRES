import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigationAPI } from "@api/resources/navigation.api";
import type { UpdateModuleRequest } from "@api/types";
import { navigationMenuKeys } from "@features/navigation/queries/navigationMenu.keys";

interface UpdateModulePayload {
  clave: string;
  data: UpdateModuleRequest;
}

/**
 * `PATCH /modules/{clave}`. Cubre TANTO la edicion de campos simples
 * (titulo/icono/destino/permisos) como el move de padre -- alcanza con
 * incluir `parentKey` en `data` (ver `MoveToFolderDialog`, que usa este
 * mismo hook con solo ese campo).
 */
export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clave, data }: UpdateModulePayload) =>
      navigationAPI.updateModule(clave, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: navigationMenuKeys.menu() });
      void queryClient.invalidateQueries({
        queryKey: navigationMenuKeys.moduleCatalog(),
      });
    },
  });
};
