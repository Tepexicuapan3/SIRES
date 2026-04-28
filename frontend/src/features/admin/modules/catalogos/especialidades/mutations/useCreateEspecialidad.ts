import { useMutation, useQueryClient } from "@tanstack/react-query";
import { especialidadesAPI } from "@api/resources/catalogos/especialidades.api";
import type { CreateEspecialidadRequest, CreateEspecialidadResponse } from "@api/types";
import { especialidadesKeys } from "@features/admin/modules/catalogos/especialidades/queries/especialidades.keys";

interface Payload {
  data: CreateEspecialidadRequest;
}

export const useCreateEspecialidad = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateEspecialidadResponse, Error, Payload>({
    mutationFn: ({ data }) => especialidadesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: especialidadesKeys.all });
    },
  });
};
