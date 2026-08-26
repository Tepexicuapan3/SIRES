import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposSanguineoAPI } from "@api/resources/catalogos/tipos-sanguineo.api";
import type { CreateTipoSanguineoRequest, CreateTipoSanguineoResponse } from "@api/types";
import { tiposSanguineoKeys } from "@features/admin/modules/catalogos/tipos-sanguineo/queries/tipos-sanguineo.keys";

interface Payload {
  data: CreateTipoSanguineoRequest;
}

export const useCreateTipoSanguineo = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTipoSanguineoResponse, Error, Payload>({
    mutationFn: ({ data }) => tiposSanguineoAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tiposSanguineoKeys.all });
    },
  });
};
