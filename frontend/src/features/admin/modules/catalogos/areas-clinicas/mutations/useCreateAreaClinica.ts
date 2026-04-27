import { useMutation, useQueryClient } from "@tanstack/react-query";
import { areasClinicasAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { CreateAreaClinicaRequest, CreateAreaClinicaResponse } from "@api/types";
import { areasClinicasKeys } from "@features/admin/modules/catalogos/areas-clinicas/queries/areas-clinicas.keys";

interface Payload {
  data: CreateAreaClinicaRequest;
}

export const useCreateAreaClinica = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateAreaClinicaResponse, Error, Payload>({
    mutationFn: ({ data }) => areasClinicasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: areasClinicasKeys.all });
    },
  });
};
