import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";

interface CancelSecondaryDiagnosisInput {
  visitId: number;
  diagnosisId: number;
}

export const useCancelSecondaryDiagnosis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, diagnosisId }: CancelSecondaryDiagnosisInput) =>
      visitsAPI.cancelSecondaryDiagnosis(visitId, diagnosisId),
    onSuccess: async (_result, { visitId }) => {
      await queryClient.invalidateQueries({
        queryKey: ["doctor-consultation", "secondary-diagnoses", visitId],
      });
    },
  });
};
