import { useMutation, useQueryClient } from "@tanstack/react-query";
import { estudiosMedicosAPI } from "@api/resources/catalogos/estudios-medicos.api";
import type {
  UpdateEstudioMedicoRequest,
  UpdateEstudioMedicoResponse,
} from "@api/types";
import { estudiosMedicosKeys } from "@features/admin/modules/catalogos/estudios-medicos/queries/estudios-medicos.keys";

interface Payload {
  id: number;
  data: UpdateEstudioMedicoRequest;
}

export const useUpdateEstudioMedico = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateEstudioMedicoResponse, Error, Payload>({
    mutationFn: ({ id, data }) => estudiosMedicosAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(estudiosMedicosKeys.detail(variables.id), {
        medicalStudy: response.medicalStudy,
      });
      void queryClient.invalidateQueries({ queryKey: estudiosMedicosKeys.all });
    },
  });
};
