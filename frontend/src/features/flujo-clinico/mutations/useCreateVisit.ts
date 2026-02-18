import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";
import type { CreateVisitRequest } from "@api/types";
import { visitFlowKeys } from "@features/flujo-clinico/queries/visit-flow.keys";

export const useCreateVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVisitRequest) => visitsAPI.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
    },
  });
};
