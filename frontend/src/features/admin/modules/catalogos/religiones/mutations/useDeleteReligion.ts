import { useMutation, useQueryClient } from "@tanstack/react-query";
import { religionesAPI } from "@api/resources/catalogos/religiones.api";
import { religionesKeys } from "@features/admin/modules/catalogos/religiones/queries/religiones.keys";

interface DeleteReligionPayload {
  id: number;
}

export const useDeleteReligion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteReligionPayload) => religionesAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: religionesKeys.list() });
      queryClient.removeQueries({ queryKey: religionesKeys.detail(variables.id) });
    },
  });
};
