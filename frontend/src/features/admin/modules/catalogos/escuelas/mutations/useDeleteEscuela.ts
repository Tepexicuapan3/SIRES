import { useMutation, useQueryClient } from "@tanstack/react-query";
import { escuelasAPI } from "@api/resources/catalogos/escuelas.api";
import { escuelasKeys } from "@features/admin/modules/catalogos/escuelas/queries/escuelas.keys";

interface DeleteEscuelaPayload {
  id: number;
}

export const useDeleteEscuela = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteEscuelaPayload) => escuelasAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: escuelasKeys.list() });
      queryClient.removeQueries({
        queryKey: escuelasKeys.detail(variables.id),
      });
    },
  });
};
