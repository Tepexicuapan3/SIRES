import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";

interface CancelPrescriptionItemInput {
  visitId: number;
  itemId: number;
}

export const useCancelPrescriptionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, itemId }: CancelPrescriptionItemInput) =>
      visitsAPI.cancelPrescriptionItem(visitId, itemId),
    onSuccess: async (_result, { visitId }) => {
      await queryClient.invalidateQueries({
        queryKey: ["doctor-consultation", "prescription-items", visitId],
      });
    },
  });
};
