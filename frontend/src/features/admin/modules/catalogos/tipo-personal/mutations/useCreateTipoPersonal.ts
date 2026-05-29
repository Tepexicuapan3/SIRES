import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tipoPersonalAPI } from "@api/resources/catalogos/tipo-personal.api";
import type { CreateTipoPersonalRequest, CreateTipoPersonalResponse } from "@api/types";
import { tipoPersonalKeys } from "@features/admin/modules/catalogos/tipo-personal/queries/tipo-personal.keys";

interface Payload {
  data: CreateTipoPersonalRequest;
}

export const useCreateTipoPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTipoPersonalResponse, Error, Payload>({
    mutationFn: ({ data }) => tipoPersonalAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tipoPersonalKeys.all });
    },
  });
};
