import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parentescoAPI } from "@api/resources/catalogos/parentesco.api";
import type { UpdateParentescoRequest, UpdateParentescoResponse } from "@api/types";
import { parentescoKeys } from "@features/admin/modules/catalogos/parentescos/queries/parentesco.keys";

interface Payload {
  id: string;
  data: UpdateParentescoRequest;
}

export const useUpdateParentesco = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateParentescoResponse, Error, Payload>({
    mutationFn: ({ id, data }) => parentescoAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(parentescoKeys.detail(variables.id), {
        kinship: response.kinship,
      });
      void queryClient.invalidateQueries({ queryKey: parentescoKeys.all });
    },
  });
};
