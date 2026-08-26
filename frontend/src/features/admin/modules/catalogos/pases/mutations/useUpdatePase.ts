import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pasesAPI } from "@api/resources/catalogos/pases.api";
import type { UpdatePaseRequest, UpdatePaseResponse } from "@api/types";
import { pasesKeys } from "@features/admin/modules/catalogos/pases/queries/pases.keys";

interface Payload {
  id: number;
  data: UpdatePaseRequest;
}

export const useUpdatePase = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdatePaseResponse, Error, Payload>({
    mutationFn: ({ id, data }) => pasesAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(pasesKeys.detail(variables.id), {
        pass: response.pass,
      });
      void queryClient.invalidateQueries({ queryKey: pasesKeys.all });
    },
  });
};
