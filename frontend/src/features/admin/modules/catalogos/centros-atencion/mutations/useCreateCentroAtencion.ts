import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  CreateCentroAtencionRequest,
  CreateCentroAtencionResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface CreateCentroAtencionPayload {
  data: CreateCentroAtencionRequest;
}

export const useCreateCentroAtencion = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateCentroAtencionResponse, Error, CreateCentroAtencionPayload>({
    mutationFn: ({ data }) => centrosAtencionAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.list(),
      });
    },
  });
};