import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  CreateCentroAtencionExcepcionRequest,
  CreateCentroAtencionExcepcionResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

interface Payload {
  data: CreateCentroAtencionExcepcionRequest;
}

export const useCreateCentroAtencionExcepcion = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateCentroAtencionExcepcionResponse, Error, Payload>({
    mutationFn: ({ data }) => centrosAtencionAPI.createExcepcion(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: centrosAtencionKeys.exceptions.all,
      });
    },
  });
};
