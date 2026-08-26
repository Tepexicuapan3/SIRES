import { useMutation, useQueryClient } from "@tanstack/react-query";
import { licenciasAPI } from "@api/resources/catalogos/licencias.api";
import type { UpdateLicenciaRequest, UpdateLicenciaResponse } from "@api/types";
import { licenciasKeys } from "@features/admin/modules/catalogos/licencias/queries/licencias.keys";

interface Payload {
  id: number;
  data: UpdateLicenciaRequest;
}

export const useUpdateLicencia = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateLicenciaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => licenciasAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(licenciasKeys.detail(variables.id), {
        license: response.license,
      });
      void queryClient.invalidateQueries({ queryKey: licenciasKeys.all });
    },
  });
};
