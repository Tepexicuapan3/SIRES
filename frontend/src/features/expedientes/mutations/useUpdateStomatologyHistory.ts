import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stomatologyHistoryAPI } from "@api/resources/stomatology-history.api";
import type { UpdateStomatologyHistoryRequest } from "@api/types";
import { stomatologyHistoryKeys } from "@features/expedientes/queries/useStomatologyHistory";

interface Payload {
  noExp: string;
  pkNum: number;
  data: UpdateStomatologyHistoryRequest;
}

export const useUpdateStomatologyHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noExp, pkNum, data }: Payload) =>
      stomatologyHistoryAPI.update(noExp, pkNum, data),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        stomatologyHistoryKeys.detail(variables.noExp, variables.pkNum),
        updated,
      );
    },
  });
};
