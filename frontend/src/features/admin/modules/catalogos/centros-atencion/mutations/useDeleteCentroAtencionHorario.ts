import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type { DeleteCentroAtencionHorarioResponse } from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Payload {
  scheduleId: number;
}

export const useDeleteCentroAtencionHorario = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteCentroAtencionHorarioResponse, Error, Payload>({
    mutationFn: ({ scheduleId }) =>
      centrosAtencionAPI.deleteSchedule(scheduleId),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.schedules.all,
      });
      queryClient.removeQueries({
        queryKey: centrosAtencionKeys.schedules.detail(variables.scheduleId),
      });
    },
  });
};
