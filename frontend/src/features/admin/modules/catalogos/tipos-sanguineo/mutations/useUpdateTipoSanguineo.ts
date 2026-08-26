import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposSanguineoAPI } from "@api/resources/catalogos/tipos-sanguineo.api";
import type { UpdateTipoSanguineoRequest, UpdateTipoSanguineoResponse } from "@api/types";
import { tiposSanguineoKeys } from "@features/admin/modules/catalogos/tipos-sanguineo/queries/tipos-sanguineo.keys";

interface Payload {
  id: number;
  data: UpdateTipoSanguineoRequest;
}

export const useUpdateTipoSanguineo = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTipoSanguineoResponse, Error, Payload>({
    mutationFn: ({ id, data }) => tiposSanguineoAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(tiposSanguineoKeys.detail(variables.id), {
        bloodType: response.bloodType,
      });
      void queryClient.invalidateQueries({ queryKey: tiposSanguineoKeys.all });
    },
  });
};
