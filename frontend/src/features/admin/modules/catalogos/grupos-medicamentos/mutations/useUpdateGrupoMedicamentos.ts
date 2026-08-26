import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gruposMedicamentosAPI } from "@api/resources/catalogos/grupos-medicamentos.api";
import type { UpdateGrupoMedicamentosRequest, UpdateGrupoMedicamentosResponse } from "@api/types";
import { gruposMedicamentosKeys } from "@features/admin/modules/catalogos/grupos-medicamentos/queries/grupos-medicamentos.keys";

interface Payload {
  id: number;
  data: UpdateGrupoMedicamentosRequest;
}

export const useUpdateGrupoMedicamentos = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateGrupoMedicamentosResponse, Error, Payload>({
    mutationFn: ({ id, data }) => gruposMedicamentosAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(gruposMedicamentosKeys.detail(variables.id), {
        medicationGroup: response.medicationGroup,
      });
      void queryClient.invalidateQueries({ queryKey: gruposMedicamentosKeys.all });
    },
  });
};
