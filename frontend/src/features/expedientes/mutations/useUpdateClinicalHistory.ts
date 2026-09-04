import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clinicalHistoryAPI } from "@api/resources/clinical-history.api";
import type { UpdateClinicalHistoryRequest } from "@api/types";
import { clinicalHistoryKeys } from "@features/expedientes/queries/useClinicalHistory";

interface Payload {
  noExp: string;
  pkNum: number;
  data: UpdateClinicalHistoryRequest;
}

export const useUpdateClinicalHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noExp, pkNum, data }: Payload) =>
      clinicalHistoryAPI.update(noExp, pkNum, data),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        clinicalHistoryKeys.detail(variables.noExp, variables.pkNum),
        updated,
      );
    },
  });
};
