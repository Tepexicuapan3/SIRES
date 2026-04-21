import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type { DeleteCentroAtencionExcepcionResponse } from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Payload {
  excepcionId: number;
}

export const useDeleteCentroAtencionExcepcion = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteCentroAtencionExcepcionResponse, Error, Payload>({
    mutationFn: ({ excepcionId }) =>
      centrosAtencionAPI.deleteExcepcion(excepcionId),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.exceptions.all,
      });
      queryClient.removeQueries({
        queryKey: centrosAtencionKeys.exceptions.detail(variables.excepcionId),
      });
    },
  });
};
