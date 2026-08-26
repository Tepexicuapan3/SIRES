import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parentescoAPI } from "@api/resources/catalogos/parentesco.api";
import type { DeleteParentescoResponse } from "@api/types";
import { parentescoKeys } from "@features/admin/modules/catalogos/parentescos/queries/parentesco.keys";

interface Payload {
  id: string;
}

export const useDeleteParentesco = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteParentescoResponse, Error, Payload>({
    mutationFn: ({ id }) => parentescoAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: parentescoKeys.all });
      queryClient.removeQueries({
        queryKey: parentescoKeys.detail(variables.id),
      });
    },
  });
};
