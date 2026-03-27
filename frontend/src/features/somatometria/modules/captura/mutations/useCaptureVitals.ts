import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { CaptureVitalsRequest } from "@api/types";
import { visitFlowKeys } from "@realtime/visits/query-keys";

interface CaptureVitalsInput {
  visitId: number;
  data: CaptureVitalsRequest;
}

export const useCaptureVitals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, data }: CaptureVitalsInput) =>
      visitsAPI.captureVitals(visitId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};
