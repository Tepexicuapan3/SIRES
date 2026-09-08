import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { AddSecondaryDiagnosisRequest } from "@api/types";

interface AddSecondaryDiagnosisInput {
  visitId: number;
  data: AddSecondaryDiagnosisRequest;
}

export const useAddSecondaryDiagnosis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, data }: AddSecondaryDiagnosisInput) =>
      visitsAPI.addSecondaryDiagnosis(visitId, data),
    onSuccess: async (_result, { visitId }) => {
      await queryClient.invalidateQueries({
        queryKey: ["doctor-consultation", "secondary-diagnoses", visitId],
      });
    },
  });
};
