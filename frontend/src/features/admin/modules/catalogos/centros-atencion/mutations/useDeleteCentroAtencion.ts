import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface DeleteCentroAtencionPayload {
  centerId: number;
}

export const useDeleteCentroAtencion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ centerId }: DeleteCentroAtencionPayload) =>
      centrosAtencionAPI.delete(centerId),
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
