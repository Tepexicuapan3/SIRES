import { useQuery } from "@tanstack/react-query";
import { odontogramAPI } from "@api/resources/odontogram.api";
import type { OdontogramDentition } from "@api/types";

export const odontogramKeys = {
  detail: (noExp: string, pkNum: number, dentition: OdontogramDentition) =>
    ["expedientes", "odontogram", noExp, pkNum, dentition] as const,
};

export const usePatientOdontogram = (
  noExp: string,
  pkNum = 0,
  dentition: OdontogramDentition = "permanent",
) => {
  return useQuery({
    queryKey: odontogramKeys.detail(noExp, pkNum, dentition),
    queryFn: () => odontogramAPI.get(noExp, pkNum, dentition),
    enabled: Boolean(noExp),
    staleTime: 30 * 1000,
  });
};
