import { useMutation, useQueryClient } from "@tanstack/react-query";
import { areasAPI } from "@api/resources/catalogos/areas.api";
import type { UpdateAreaRequest } from "@api/types";
import { areasKeys } from "@features/admin/modules/catalogos/areas/queries/areas.keys";

interface UpdateAreaPayload {
  areaId: number;
  data: UpdateAreaRequest;
}

export const useUpdateArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ areaId, data }: UpdateAreaPayload) =>
      areasAPI.update(areaId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(areasKeys.detail(response.area.id), {
        area: response.area,
      });
      void queryClient.invalidateQueries({ queryKey: areasKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: areasKeys.detail(variables.areaId),
      });
    },
  });
};
