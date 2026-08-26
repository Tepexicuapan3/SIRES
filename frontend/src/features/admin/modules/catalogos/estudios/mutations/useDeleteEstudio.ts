import { useMutation, useQueryClient } from "@tanstack/react-query";
import { estudiosAPI } from "@api/resources/catalogos/estudios.api";
import { estudiosKeys } from "@features/admin/modules/catalogos/estudios/queries/estudios.keys";

interface DeleteEstudioPayload {
  id: number;
}

export const useDeleteEstudio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteEstudioPayload) => estudiosAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: estudiosKeys.list(),
      });
      queryClient.removeQueries({
        queryKey: estudiosKeys.detail(variables.id),
      });
    },
  });
};
