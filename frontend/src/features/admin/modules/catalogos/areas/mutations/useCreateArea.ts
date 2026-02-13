import { useMutation, useQueryClient } from "@tanstack/react-query";
import { areasAPI } from "@api/resources/catalogos/areas.api";
import type { CreateAreaRequest } from "@api/types";
import { areasKeys } from "@features/admin/modules/catalogos/areas/queries/areas.keys";

interface CreateAreaPayload {
  data: CreateAreaRequest;
}

export const useCreateArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateAreaPayload) => areasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: areasKeys.list() });
    },
  });
};
