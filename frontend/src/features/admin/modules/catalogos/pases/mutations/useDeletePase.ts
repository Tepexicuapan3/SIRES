import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pasesAPI } from "@api/resources/catalogos/pases.api";
import type { DeletePaseResponse } from "@api/types";
import { pasesKeys } from "@features/admin/modules/catalogos/pases/queries/pases.keys";

interface Payload {
  id: number;
}

export const useDeletePase = () => {
  const queryClient = useQueryClient();

  return useMutation<DeletePaseResponse, Error, Payload>({
    mutationFn: ({ id }) => pasesAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: pasesKeys.all });
      queryClient.removeQueries({
        queryKey: pasesKeys.detail(variables.id),
      });
    },
  });
};
