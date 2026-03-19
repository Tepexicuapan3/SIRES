import { useMutation, useQueryClient } from "@tanstack/react-query";

import { visitsAPI } from "@api/resources/visits.api";
import { visitFlowKeys } from "@/realtime/visits/query-keys";

interface StartConsultationInput {
  visitId: number;
}

export const useStartConsultation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId }: StartConsultationInput) =>
      visitsAPI.startConsultation(visitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};
