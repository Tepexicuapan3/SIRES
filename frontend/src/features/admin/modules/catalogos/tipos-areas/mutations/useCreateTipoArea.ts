import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposAreasAPI } from "@api/resources/catalogos/tipos-areas.api";
import type { CreateTipoAreaRequest, CreateTipoAreaResponse } from "@api/types";
import { tiposAreasKeys } from "@features/admin/modules/catalogos/tipos-areas/queries/tipos-areas.keys";

interface Payload {
  data: CreateTipoAreaRequest;
}

export const useCreateTipoArea = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTipoAreaResponse, Error, Payload>({
    mutationFn: ({ data }) => tiposAreasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tiposAreasKeys.all });
    },
  });
};
