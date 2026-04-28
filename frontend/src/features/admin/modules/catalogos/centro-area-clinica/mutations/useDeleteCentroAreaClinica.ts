import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centroAreaClinicaAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { DeleteCentroAreaClinicaResponse } from "@api/types";
import { centroAreaClinicaKeys } from "@features/admin/modules/catalogos/centro-area-clinica/queries/centro-area-clinica.keys";

interface Payload {
  centerId: number;
  areaId: number;
}

export const useDeleteCentroAreaClinica = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteCentroAreaClinicaResponse, Error, Payload>({
    mutationFn: ({ centerId, areaId }) => centroAreaClinicaAPI.delete(centerId, areaId),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: centroAreaClinicaKeys.all });
      queryClient.removeQueries({
        queryKey: centroAreaClinicaKeys.detail(variables.centerId, variables.areaId),
      });
    },
  });
};
