import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bajasAPI } from "@api/resources/catalogos/bajas.api";
import type { CreateBajaRequest, CreateBajaResponse } from "@api/types";
import { bajasKeys } from "@features/admin/modules/catalogos/bajas/queries/bajas.keys";

interface Payload {
  data: CreateBajaRequest;
}

export const useCreateBaja = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateBajaResponse, Error, Payload>({
    mutationFn: ({ data }) => bajasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bajasKeys.all });
    },
  });
};
