import { useMutation, useQueryClient } from "@tanstack/react-query";
import { escolaridadAPI } from "@api/resources/catalogos/escolaridad.api";
import type { UpdateEscolaridadRequest, UpdateEscolaridadResponse } from "@api/types";
import { escolaridadKeys } from "@features/admin/modules/catalogos/escolaridad/queries/escolaridad.keys";

interface Payload {
  id: number;
  data: UpdateEscolaridadRequest;
}

export const useUpdateEscolaridad = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateEscolaridadResponse, Error, Payload>({
    mutationFn: ({ id, data }) => escolaridadAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(escolaridadKeys.detail(variables.id), {
        educationLevel: response.educationLevel,
      });
      void queryClient.invalidateQueries({ queryKey: escolaridadKeys.all });
    },
  });
};
