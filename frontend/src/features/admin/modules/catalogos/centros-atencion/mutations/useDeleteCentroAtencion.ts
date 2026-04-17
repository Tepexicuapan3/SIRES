import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type { DeleteCentroAtencionResponse } from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface DeleteCentroAtencionPayload {
  centerId: number;
}

export const useDeleteCentroAtencion = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteCentroAtencionResponse,
    Error,
    DeleteCentroAtencionPayload
  >({
    mutationFn: ({ centerId }) => centrosAtencionAPI.delete(centerId),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.list(),
      });

      queryClient.removeQueries({
        queryKey: centrosAtencionKeys.detail(variables.centerId),
      });
    },
  });
};