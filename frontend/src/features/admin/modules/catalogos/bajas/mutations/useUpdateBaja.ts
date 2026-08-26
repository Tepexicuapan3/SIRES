import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bajasAPI } from "@api/resources/catalogos/bajas.api";
import type { UpdateBajaRequest, UpdateBajaResponse } from "@api/types";
import { bajasKeys } from "@features/admin/modules/catalogos/bajas/queries/bajas.keys";

interface Payload {
  id: number;
  data: UpdateBajaRequest;
}

export const useUpdateBaja = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateBajaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => bajasAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(bajasKeys.detail(variables.id), {
        dischargeReason: response.dischargeReason,
      });
      void queryClient.invalidateQueries({ queryKey: bajasKeys.all });
    },
  });
};
