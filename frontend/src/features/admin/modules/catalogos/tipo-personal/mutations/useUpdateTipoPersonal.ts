import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tipoPersonalAPI } from "@api/resources/catalogos/tipo-personal.api";
import type { UpdateTipoPersonalRequest, UpdateTipoPersonalResponse } from "@api/types";
import { tipoPersonalKeys } from "@features/admin/modules/catalogos/tipo-personal/queries/tipo-personal.keys";

interface Payload {
  id: number;
  data: UpdateTipoPersonalRequest;
}

export const useUpdateTipoPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTipoPersonalResponse, Error, Payload>({
    mutationFn: ({ id, data }) => tipoPersonalAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(tipoPersonalKeys.detail(variables.id), {
        personalType: response.personalType,
      });
      void queryClient.invalidateQueries({ queryKey: tipoPersonalKeys.all });
    },
  });
};
