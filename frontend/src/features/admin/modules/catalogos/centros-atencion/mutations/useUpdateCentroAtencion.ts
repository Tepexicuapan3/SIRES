import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type { UpdateCentroAtencionRequest } from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface UpdateCentroAtencionPayload {
  centerId: number;
  data: UpdateCentroAtencionRequest;
}

export const useUpdateCentroAtencion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ centerId, data }: UpdateCentroAtencionPayload) =>
      centrosAtencionAPI.update(centerId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(centrosAtencionKeys.detail(response.center.id), {
        center: response.center,
      });
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.detail(variables.centerId),
      });
    },
  });
};
