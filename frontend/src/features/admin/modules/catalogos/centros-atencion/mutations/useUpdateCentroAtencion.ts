import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  UpdateCentroAtencionRequest,
  UpdateCentroAtencionResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface UpdateCentroAtencionPayload {
  centerId: number;
  data: UpdateCentroAtencionRequest;
}

export const useUpdateCentroAtencion = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateCentroAtencionResponse,
    Error,
    UpdateCentroAtencionPayload
  >({
    mutationFn: ({ centerId, data }) =>
      centrosAtencionAPI.update(centerId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        centrosAtencionKeys.detail(response.careCenter.id),
        {
          careCenter: response.careCenter,
        },
      );

      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.list(),
      });

      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.detail(variables.centerId),
      });
    },
  });
};