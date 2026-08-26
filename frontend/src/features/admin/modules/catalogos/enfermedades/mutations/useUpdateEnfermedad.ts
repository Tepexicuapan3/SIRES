import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enfermedadesAPI } from "@api/resources/catalogos/enfermedades.api";
import type { UpdateEnfermedadRequest, UpdateEnfermedadResponse } from "@api/types";
import { enfermedadesKeys } from "@features/admin/modules/catalogos/enfermedades/queries/enfermedades.keys";

interface Payload {
  id: number;
  data: UpdateEnfermedadRequest;
}

export const useUpdateEnfermedad = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateEnfermedadResponse, Error, Payload>({
    mutationFn: ({ id, data }) => enfermedadesAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(enfermedadesKeys.detail(variables.id), {
        disease: response.disease,
      });
      void queryClient.invalidateQueries({ queryKey: enfermedadesKeys.all });
    },
  });
};
