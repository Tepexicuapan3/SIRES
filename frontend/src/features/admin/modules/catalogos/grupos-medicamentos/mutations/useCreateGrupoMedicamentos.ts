import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gruposMedicamentosAPI } from "@api/resources/catalogos/grupos-medicamentos.api";
import type { CreateGrupoMedicamentosRequest, CreateGrupoMedicamentosResponse } from "@api/types";
import { gruposMedicamentosKeys } from "@features/admin/modules/catalogos/grupos-medicamentos/queries/grupos-medicamentos.keys";

interface Payload {
  data: CreateGrupoMedicamentosRequest;
}

export const useCreateGrupoMedicamentos = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateGrupoMedicamentosResponse, Error, Payload>({
    mutationFn: ({ data }) => gruposMedicamentosAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gruposMedicamentosKeys.all });
    },
  });
};
