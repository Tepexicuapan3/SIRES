import { useMutation, useQueryClient } from "@tanstack/react-query";
import { estudiosAPI } from "@api/resources/catalogos/estudios.api";
import type { CreateEstudioRequest, CreateEstudioResponse } from "@api/types";
import { estudiosKeys } from "@features/admin/modules/catalogos/estudios/queries/estudios.keys";

interface Payload {
  data: CreateEstudioRequest;
}

export const useCreateEstudio = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateEstudioResponse, Error, Payload>({
    mutationFn: ({ data }) => estudiosAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: estudiosKeys.all });
    },
  });
};
