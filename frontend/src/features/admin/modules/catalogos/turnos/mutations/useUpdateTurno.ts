import { useMutation, useQueryClient } from "@tanstack/react-query";
import { turnosAPI } from "@api/resources/catalogos/turnos.api";
import type { UpdateTurnoRequest, UpdateTurnoResponse } from "@api/types";
import { turnosKeys } from "@features/admin/modules/catalogos/turnos/queries/turnos.keys";

interface Payload {
  turnoId: number;
  data: UpdateTurnoRequest;
}

export const useUpdateTurno = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTurnoResponse, Error, Payload>({
    mutationFn: ({ turnoId, data }) => turnosAPI.update(turnoId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(turnosKeys.detail(variables.turnoId), {
        shift: response.shift,
      });
      void queryClient.invalidateQueries({ queryKey: turnosKeys.all });
    },
  });
};
