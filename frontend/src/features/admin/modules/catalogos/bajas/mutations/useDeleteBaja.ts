import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bajasAPI } from "@api/resources/catalogos/bajas.api";
import type { DeleteBajaResponse } from "@api/types";
import { bajasKeys } from "@features/admin/modules/catalogos/bajas/queries/bajas.keys";

interface Payload {
  id: number;
}

export const useDeleteBaja = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteBajaResponse, Error, Payload>({
    mutationFn: ({ id }) => bajasAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: bajasKeys.all });
      queryClient.removeQueries({
        queryKey: bajasKeys.detail(variables.id),
      });
    },
  });
};
