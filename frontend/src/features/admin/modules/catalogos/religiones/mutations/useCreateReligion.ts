import { useMutation, useQueryClient } from "@tanstack/react-query";
import { religionesAPI } from "@api/resources/catalogos/religiones.api";
import type { CreateReligionRequest, CreateReligionResponse } from "@api/types";
import { religionesKeys } from "@features/admin/modules/catalogos/religiones/queries/religiones.keys";

interface Payload {
  data: CreateReligionRequest;
}

export const useCreateReligion = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateReligionResponse, Error, Payload>({
    mutationFn: ({ data }) => religionesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: religionesKeys.all });
    },
  });
};
