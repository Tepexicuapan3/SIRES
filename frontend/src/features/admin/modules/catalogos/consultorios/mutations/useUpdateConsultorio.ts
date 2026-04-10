import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consultoriosAPI } from "@api/resources/catalogos/consultorios.api";
import type { UpdateConsultorioRequest } from "@api/types";
import { consultoriosKeys } from "@features/admin/modules/catalogos/consultorios/queries/consultorios.keys";

interface UpdateConsultorioPayload {
  consultorioId: number;
  data: UpdateConsultorioRequest;
}

export const useUpdateConsultorio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ consultorioId, data }: UpdateConsultorioPayload) =>
      consultoriosAPI.update(consultorioId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        consultoriosKeys.detail(response.consultingRoom.id),
        {
          consultingRoom: response.consultingRoom,
        },
      );
      void queryClient.invalidateQueries({ queryKey: consultoriosKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: consultoriosKeys.detail(variables.consultorioId),
      });
    },
  });
};
