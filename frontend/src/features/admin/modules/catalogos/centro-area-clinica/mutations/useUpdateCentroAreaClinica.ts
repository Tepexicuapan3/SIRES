import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centroAreaClinicaAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { UpdateCentroAreaClinicaRequest, UpdateCentroAreaClinicaResponse } from "@api/types";
import { centroAreaClinicaKeys } from "@features/admin/modules/catalogos/centro-area-clinica/queries/centro-area-clinica.keys";

interface Payload {
  centerId: number;
  areaId: number;
  data: UpdateCentroAreaClinicaRequest;
}

export const useUpdateCentroAreaClinica = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateCentroAreaClinicaResponse, Error, Payload>({
    mutationFn: ({ centerId, areaId, data }) =>
      centroAreaClinicaAPI.update(centerId, areaId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        centroAreaClinicaKeys.detail(variables.centerId, variables.areaId),
        { careCenterClinicalArea: response.careCenterClinicalArea },
      );
      void queryClient.invalidateQueries({ queryKey: centroAreaClinicaKeys.all });
    },
  });
};
