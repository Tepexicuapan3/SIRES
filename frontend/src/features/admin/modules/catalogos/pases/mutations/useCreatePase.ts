import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pasesAPI } from "@api/resources/catalogos/pases.api";
import type { CreatePaseRequest, CreatePaseResponse } from "@api/types";
import { pasesKeys } from "@features/admin/modules/catalogos/pases/queries/pases.keys";

interface Payload {
  data: CreatePaseRequest;
}

export const useCreatePase = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePaseResponse, Error, Payload>({
    mutationFn: ({ data }) => pasesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pasesKeys.all });
    },
  });
};
