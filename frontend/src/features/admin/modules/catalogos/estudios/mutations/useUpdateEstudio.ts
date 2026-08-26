import { useMutation, useQueryClient } from "@tanstack/react-query";
import { estudiosAPI } from "@api/resources/catalogos/estudios.api";
import type { UpdateEstudioRequest, UpdateEstudioResponse } from "@api/types";
import { estudiosKeys } from "@features/admin/modules/catalogos/estudios/queries/estudios.keys";

interface Payload {
  id: number;
  data: UpdateEstudioRequest;
}

export const useUpdateEstudio = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateEstudioResponse, Error, Payload>({
    mutationFn: ({ id, data }) => estudiosAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(estudiosKeys.detail(variables.id), {
        estudio: response.estudio,
      });
      void queryClient.invalidateQueries({ queryKey: estudiosKeys.all });
    },
  });
};
