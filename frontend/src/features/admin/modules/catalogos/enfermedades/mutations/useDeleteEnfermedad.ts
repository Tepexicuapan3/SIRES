import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enfermedadesAPI } from "@api/resources/catalogos/enfermedades.api";
import { enfermedadesKeys } from "@features/admin/modules/catalogos/enfermedades/queries/enfermedades.keys";

interface Payload {
  id: number;
}

export const useDeleteEnfermedad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: Payload) => enfermedadesAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: enfermedadesKeys.all });
      queryClient.removeQueries({
        queryKey: enfermedadesKeys.detail(variables.id),
      });
    },
  });
};
