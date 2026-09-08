import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { AddPrescriptionItemRequest } from "@api/types";

interface AddPrescriptionItemInput {
  visitId: number;
  data: AddPrescriptionItemRequest;
}

export const useAddPrescriptionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, data }: AddPrescriptionItemInput) =>
      visitsAPI.addPrescriptionItem(visitId, data),
    onSuccess: async (_result, { visitId }) => {
      await queryClient.invalidateQueries({
        queryKey: ["doctor-consultation", "prescription-items", visitId],
      });
    },
  });
};
