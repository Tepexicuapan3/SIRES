import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centroAreaClinicaAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { CreateCentroAreaClinicaRequest, CreateCentroAreaClinicaResponse } from "@api/types";
import { centroAreaClinicaKeys } from "@features/admin/modules/catalogos/centro-area-clinica/queries/centro-area-clinica.keys";

interface Payload {
  data: CreateCentroAreaClinicaRequest;
}

export const useCreateCentroAreaClinica = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateCentroAreaClinicaResponse, Error, Payload>({
    mutationFn: ({ data }) => centroAreaClinicaAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: centroAreaClinicaKeys.all });
    },
  });
};
