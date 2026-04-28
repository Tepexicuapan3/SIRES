import { useMutation, useQueryClient } from "@tanstack/react-query";
import { especialidadesAPI } from "@api/resources/catalogos/especialidades.api";
import { especialidadesKeys } from "@features/admin/modules/catalogos/especialidades/queries/especialidades.keys";

interface Payload {
  id: number;
}

export const useDeleteEspecialidad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: Payload) => especialidadesAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: especialidadesKeys.list() });
      queryClient.removeQueries({
        queryKey: especialidadesKeys.detail(variables.id),
      });
    },
  });
};
