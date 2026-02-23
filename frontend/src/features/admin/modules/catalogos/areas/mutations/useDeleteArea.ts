import { useMutation, useQueryClient } from "@tanstack/react-query";
import { areasAPI } from "@api/resources/catalogos/areas.api";
import { areasKeys } from "@features/admin/modules/catalogos/areas/queries/areas.keys";

interface DeleteAreaPayload {
  areaId: number;
}

export const useDeleteArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ areaId }: DeleteAreaPayload) => areasAPI.delete(areaId),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: areasKeys.list() });
      queryClient.removeQueries({
        queryKey: areasKeys.detail(variables.areaId),
      });
    },
  });
};
