import { useMutation, useQueryClient } from "@tanstack/react-query";
import { estudiosMedicosAPI } from "@api/resources/catalogos/estudios-medicos.api";
import type {
  CreateEstudioMedicoRequest,
  CreateEstudioMedicoResponse,
} from "@api/types";
import { estudiosMedicosKeys } from "@features/admin/modules/catalogos/estudios-medicos/queries/estudios-medicos.keys";

interface Payload {
  data: CreateEstudioMedicoRequest;
}

export const useCreateEstudioMedico = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateEstudioMedicoResponse, Error, Payload>({
    mutationFn: ({ data }) => estudiosMedicosAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: estudiosMedicosKeys.all });
    },
  });
};
