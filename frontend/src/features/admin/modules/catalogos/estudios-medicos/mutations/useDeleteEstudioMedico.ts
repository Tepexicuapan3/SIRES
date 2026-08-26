import { useMutation, useQueryClient } from "@tanstack/react-query";
import { estudiosMedicosAPI } from "@api/resources/catalogos/estudios-medicos.api";
import { estudiosMedicosKeys } from "@features/admin/modules/catalogos/estudios-medicos/queries/estudios-medicos.keys";

interface DeleteEstudioMedicoPayload {
  id: number;
}

export const useDeleteEstudioMedico = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteEstudioMedicoPayload) =>
      estudiosMedicosAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: estudiosMedicosKeys.list(),
      });
      queryClient.removeQueries({
        queryKey: estudiosMedicosKeys.detail(variables.id),
      });
    },
  });
};
