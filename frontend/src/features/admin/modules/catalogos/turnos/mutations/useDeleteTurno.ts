import { useMutation, useQueryClient } from "@tanstack/react-query";
import { turnosAPI } from "@api/resources/catalogos/turnos.api";
import type { DeleteTurnoResponse } from "@api/types";
import { turnosKeys } from "@features/admin/modules/catalogos/turnos/queries/turnos.keys";

interface Payload {
  turnoId: number;
}

export const useDeleteTurno = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteTurnoResponse, Error, Payload>({
    mutationFn: ({ turnoId }) => turnosAPI.delete(turnoId),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: turnosKeys.all });
      queryClient.removeQueries({
        queryKey: turnosKeys.detail(variables.turnoId),
      });
    },
  });
};
