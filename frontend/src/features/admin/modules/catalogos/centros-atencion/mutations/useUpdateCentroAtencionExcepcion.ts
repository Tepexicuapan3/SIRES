import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  UpdateCentroAtencionExcepcionRequest,
  UpdateCentroAtencionExcepcionResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Payload {
  excepcionId: number;
  data: UpdateCentroAtencionExcepcionRequest;
}

export const useUpdateCentroAtencionExcepcion = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateCentroAtencionExcepcionResponse, Error, Payload>({
    mutationFn: ({ excepcionId, data }) =>
      centrosAtencionAPI.updateExcepcion(excepcionId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        centrosAtencionKeys.exceptions.detail(variables.excepcionId),
        { careCenterException: response.careCenterException },
      );
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.exceptions.all,
      });
    },
  });
};
