import { useMutation, useQueryClient } from "@tanstack/react-query";
import { licenciasAPI } from "@api/resources/catalogos/licencias.api";
import type { CreateLicenciaRequest, CreateLicenciaResponse } from "@api/types";
import { licenciasKeys } from "@features/admin/modules/catalogos/licencias/queries/licencias.keys";

interface Payload {
  data: CreateLicenciaRequest;
}

export const useCreateLicencia = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateLicenciaResponse, Error, Payload>({
    mutationFn: ({ data }) => licenciasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: licenciasKeys.all });
    },
  });
};
