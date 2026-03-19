import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { SavePrescriptionRequest } from "@api/types";
import { visitFlowKeys } from "@/realtime/visits/query-keys";

interface SavePrescriptionsInput {
  visitId: number;
  data: SavePrescriptionRequest;
}

export const useSavePrescriptions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, data }: SavePrescriptionsInput) =>
      visitsAPI.savePrescriptions(visitId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};
