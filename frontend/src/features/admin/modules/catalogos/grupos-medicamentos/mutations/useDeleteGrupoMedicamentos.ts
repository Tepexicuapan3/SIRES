import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gruposMedicamentosAPI } from "@api/resources/catalogos/grupos-medicamentos.api";
import type { DeleteGrupoMedicamentosResponse } from "@api/types";
import { gruposMedicamentosKeys } from "@features/admin/modules/catalogos/grupos-medicamentos/queries/grupos-medicamentos.keys";

interface Payload {
  id: number;
}

export const useDeleteGrupoMedicamentos = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteGrupoMedicamentosResponse, Error, Payload>({
    mutationFn: ({ id }) => gruposMedicamentosAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: gruposMedicamentosKeys.all });
      queryClient.removeQueries({
        queryKey: gruposMedicamentosKeys.detail(variables.id),
      });
    },
  });
};
