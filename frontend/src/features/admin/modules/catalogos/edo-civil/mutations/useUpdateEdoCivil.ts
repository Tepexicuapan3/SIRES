import { useMutation, useQueryClient } from "@tanstack/react-query";
import { edoCivilAPI } from "@api/resources/catalogos/edoCivil.api";
import type { UpdateEdoCivilRequest, UpdateEdoCivilResponse } from "@api/types";
import { edoCivilKeys } from "@features/admin/modules/catalogos/edo-civil/queries/edoCivil.keys";

interface Payload {
  id: number;
  data: UpdateEdoCivilRequest;
}

export const useUpdateEdoCivil = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateEdoCivilResponse, Error, Payload>({
    mutationFn: ({ id, data }) => edoCivilAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(edoCivilKeys.detail(variables.id), {
        civilStatus: response.civilStatus,
      });
      void queryClient.invalidateQueries({ queryKey: edoCivilKeys.all });
    },
  });
};
