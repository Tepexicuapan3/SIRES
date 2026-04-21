import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  CreateCentroAtencionHorarioRequest,
  CreateCentroAtencionHorarioResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Payload {
  data: CreateCentroAtencionHorarioRequest;
}

export const useCreateCentroAtencionHorario = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateCentroAtencionHorarioResponse, Error, Payload>({
    mutationFn: ({ data }) => centrosAtencionAPI.createSchedule(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.schedules.all,
      });
    },
  });
};
