import { useMutation, useQueryClient } from "@tanstack/react-query";
import { religionesAPI } from "@api/resources/catalogos/religiones.api";
import type { UpdateReligionRequest, UpdateReligionResponse } from "@api/types";
import { religionesKeys } from "@features/admin/modules/catalogos/religiones/queries/religiones.keys";

interface Payload {
  id: number;
  data: UpdateReligionRequest;
}

export const useUpdateReligion = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateReligionResponse, Error, Payload>({
    mutationFn: ({ id, data }) => religionesAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(religionesKeys.detail(variables.id), {
        religion: response.religion,
      });
      void queryClient.invalidateQueries({ queryKey: religionesKeys.all });
    },
  });
};
