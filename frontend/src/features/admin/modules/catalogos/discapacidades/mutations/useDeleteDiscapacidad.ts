import { useMutation, useQueryClient } from "@tanstack/react-query";
import { discapacidadesAPI } from "@api/resources/catalogos/discapacidades.api";
import { discapacidadesKeys } from "@features/admin/modules/catalogos/discapacidades/queries/discapacidades.keys";

interface DeleteDiscapacidadPayload {
  id: number;
}

export const useDeleteDiscapacidad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteDiscapacidadPayload) => discapacidadesAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: discapacidadesKeys.list() });
      queryClient.removeQueries({
        queryKey: discapacidadesKeys.detail(variables.id),
      });
    },
  });
};
