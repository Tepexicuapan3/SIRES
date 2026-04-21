import { useMutation, useQueryClient } from "@tanstack/react-query";
import { escuelasAPI } from "@api/resources/catalogos/escuelas.api";
import type { UpdateEscuelaRequest, UpdateEscuelaResponse } from "@api/types";
import { escuelasKeys } from "@features/admin/modules/catalogos/escuelas/queries/escuelas.keys";

interface Payload {
  id: number;
  data: UpdateEscuelaRequest;
}

export const useUpdateEscuela = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateEscuelaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => escuelasAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(escuelasKeys.detail(variables.id), {
        school: response.school,
      });
      void queryClient.invalidateQueries({ queryKey: escuelasKeys.all });
    },
  });
};
