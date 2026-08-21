import { useMutation, useQueryClient } from "@tanstack/react-query";
import { edoCivilAPI } from "@api/resources/catalogos/edoCivil.api";
import { edoCivilKeys } from "@features/admin/modules/catalogos/edo-civil/queries/edoCivil.keys";

interface DeleteEdoCivilPayload {
  id: number;
}

export const useDeleteEdoCivil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteEdoCivilPayload) => edoCivilAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: edoCivilKeys.list() });
      queryClient.removeQueries({
        queryKey: edoCivilKeys.detail(variables.id),
      });
    },
  });
};
