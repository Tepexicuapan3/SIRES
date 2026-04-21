import { useMutation, useQueryClient } from "@tanstack/react-query";
import { turnosAPI } from "@api/resources/catalogos/turnos.api";
import type { CreateTurnoRequest, CreateTurnoResponse } from "@api/types";
import { turnosKeys } from "@features/admin/modules/catalogos/turnos/queries/turnos.keys";

interface Payload {
  data: CreateTurnoRequest;
}

export const useCreateTurno = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTurnoResponse, Error, Payload>({
    mutationFn: ({ data }) => turnosAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: turnosKeys.all });
    },
  });
};
