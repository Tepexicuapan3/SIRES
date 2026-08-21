import { useMutation, useQueryClient } from "@tanstack/react-query";
import { edoCivilAPI } from "@api/resources/catalogos/edoCivil.api";
import type { CreateEdoCivilRequest, CreateEdoCivilResponse } from "@api/types";
import { edoCivilKeys } from "@features/admin/modules/catalogos/edo-civil/queries/edoCivil.keys";

interface Payload {
  data: CreateEdoCivilRequest;
}

export const useCreateEdoCivil = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateEdoCivilResponse, Error, Payload>({
    mutationFn: ({ data }) => edoCivilAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: edoCivilKeys.all });
    },
  });
};
