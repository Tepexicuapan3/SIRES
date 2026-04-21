import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposAreasAPI } from "@api/resources/catalogos/tipos-areas.api";
import type { UpdateTipoAreaRequest, UpdateTipoAreaResponse } from "@api/types";
import { tiposAreasKeys } from "@features/admin/modules/catalogos/tipos-areas/queries/tipos-areas.keys";

interface Payload {
  id: number;
  data: UpdateTipoAreaRequest;
}

export const useUpdateTipoArea = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTipoAreaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => tiposAreasAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(tiposAreasKeys.detail(variables.id), {
        areaType: response.areaType,
      });
      void queryClient.invalidateQueries({ queryKey: tiposAreasKeys.all });
    },
  });
};
