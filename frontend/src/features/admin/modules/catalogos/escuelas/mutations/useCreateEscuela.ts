import { useMutation, useQueryClient } from "@tanstack/react-query";
import { escuelasAPI } from "@api/resources/catalogos/escuelas.api";
import type { CreateEscuelaRequest, CreateEscuelaResponse } from "@api/types";
import { escuelasKeys } from "@features/admin/modules/catalogos/escuelas/queries/escuelas.keys";

interface Payload {
  data: CreateEscuelaRequest;
}

export const useCreateEscuela = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateEscuelaResponse, Error, Payload>({
    mutationFn: ({ data }) => escuelasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: escuelasKeys.all });
    },
  });
};
