import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parentescoAPI } from "@api/resources/catalogos/parentesco.api";
import type { CreateParentescoRequest, CreateParentescoResponse } from "@api/types";
import { parentescoKeys } from "@features/admin/modules/catalogos/parentescos/queries/parentesco.keys";

interface Payload {
  data: CreateParentescoRequest;
}

export const useCreateParentesco = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateParentescoResponse, Error, Payload>({
    mutationFn: ({ data }) => parentescoAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parentescoKeys.all });
    },
  });
};
