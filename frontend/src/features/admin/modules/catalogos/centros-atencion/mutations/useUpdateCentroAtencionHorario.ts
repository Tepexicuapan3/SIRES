import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  UpdateCentroAtencionHorarioRequest,
  UpdateCentroAtencionHorarioResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Payload {
  scheduleId: number;
  data: UpdateCentroAtencionHorarioRequest;
}

export const useUpdateCentroAtencionHorario = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateCentroAtencionHorarioResponse, Error, Payload>({
    mutationFn: ({ scheduleId, data }) =>
      centrosAtencionAPI.updateSchedule(scheduleId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        centrosAtencionKeys.schedules.detail(variables.scheduleId),
        { careCenterSchedule: response.careCenterSchedule },
      );
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.schedules.all,
      });
    },
  });
};
