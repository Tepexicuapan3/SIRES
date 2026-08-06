import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposCitasAPI } from "@api/resources/catalogos/tipos-citas.api";
import type { UpdateTipoCitaRequest, UpdateTipoCitaResponse } from "@api/types";
import { tiposCitasKeys } from "@features/admin/modules/catalogos/tipos-citas/queries/tipos-citas.keys";

interface Payload {
  id: number;
  data: UpdateTipoCitaRequest;
}

export const useUpdateTipoCita = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTipoCitaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => tiposCitasAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(tiposCitasKeys.detail(variables.id), {
        appointmentType: response.appointmentType,
      });
      void queryClient.invalidateQueries({ queryKey: tiposCitasKeys.all });
    },
  });
};
