import { useMutation, useQueryClient } from "@tanstack/react-query";
import { discapacidadesAPI } from "@api/resources/catalogos/discapacidades.api";
import type { UpdateDiscapacidadRequest, UpdateDiscapacidadResponse } from "@api/types";
import { discapacidadesKeys } from "@features/admin/modules/catalogos/discapacidades/queries/discapacidades.keys";

interface Payload {
  id: number;
  data: UpdateDiscapacidadRequest;
}

export const useUpdateDiscapacidad = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateDiscapacidadResponse, Error, Payload>({
    mutationFn: ({ id, data }) => discapacidadesAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(discapacidadesKeys.detail(variables.id), {
        disability: response.disability,
      });
      void queryClient.invalidateQueries({ queryKey: discapacidadesKeys.all });
    },
  });
};
