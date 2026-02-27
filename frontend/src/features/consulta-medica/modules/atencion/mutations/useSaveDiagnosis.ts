import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { SaveDiagnosisRequest } from "@api/types";
import { visitFlowKeys } from "@/realtime/visits/query-keys";

interface SaveDiagnosisInput {
  visitId: number;
  data: SaveDiagnosisRequest;
}

export const useSaveDiagnosis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, data }: SaveDiagnosisInput) =>
      visitsAPI.saveDiagnosis(visitId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};
