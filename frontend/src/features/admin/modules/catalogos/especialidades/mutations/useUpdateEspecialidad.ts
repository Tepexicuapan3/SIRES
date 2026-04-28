import { useMutation, useQueryClient } from "@tanstack/react-query";
import { especialidadesAPI } from "@api/resources/catalogos/especialidades.api";
import type { UpdateEspecialidadRequest, UpdateEspecialidadResponse } from "@api/types";
import { especialidadesKeys } from "@features/admin/modules/catalogos/especialidades/queries/especialidades.keys";

interface Payload {
  id: number;
  data: UpdateEspecialidadRequest;
}

export const useUpdateEspecialidad = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateEspecialidadResponse, Error, Payload>({
    mutationFn: ({ id, data }) => especialidadesAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(especialidadesKeys.detail(variables.id), {
        specialty: response.specialty,
      });
      void queryClient.invalidateQueries({ queryKey: especialidadesKeys.all });
    },
  });
};
