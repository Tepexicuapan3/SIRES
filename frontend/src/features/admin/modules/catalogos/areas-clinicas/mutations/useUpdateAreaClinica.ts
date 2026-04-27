import { useMutation, useQueryClient } from "@tanstack/react-query";
import { areasClinicasAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { UpdateAreaClinicaRequest, UpdateAreaClinicaResponse } from "@api/types";
import { areasClinicasKeys } from "@features/admin/modules/catalogos/areas-clinicas/queries/areas-clinicas.keys";

interface Payload {
  id: number;
  data: UpdateAreaClinicaRequest;
}

export const useUpdateAreaClinica = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateAreaClinicaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => areasClinicasAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(areasClinicasKeys.detail(variables.id), {
        clinicalArea: response.clinicalArea,
      });
      void queryClient.invalidateQueries({ queryKey: areasClinicasKeys.all });
    },
  });
};
