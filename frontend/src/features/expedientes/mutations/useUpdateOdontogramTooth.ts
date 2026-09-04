import { useMutation, useQueryClient } from "@tanstack/react-query";
import { odontogramAPI } from "@api/resources/odontogram.api";
import type { OdontogramDentition, UpdateOdontogramToothRequest } from "@api/types";
import { odontogramKeys } from "@features/expedientes/queries/usePatientOdontogram";

interface Payload {
  noExp: string;
  pkNum: number;
  toothFdi: string;
  dentition: OdontogramDentition;
  data: UpdateOdontogramToothRequest;
}

export const useUpdateOdontogramTooth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noExp, pkNum, toothFdi, data }: Payload) =>
      odontogramAPI.updateTooth(noExp, pkNum, toothFdi, data),
    onSuccess: (_updated, variables) => {
      void queryClient.invalidateQueries({
        queryKey: odontogramKeys.detail(
          variables.noExp,
          variables.pkNum,
          variables.dentition,
        ),
      });
    },
  });
};
