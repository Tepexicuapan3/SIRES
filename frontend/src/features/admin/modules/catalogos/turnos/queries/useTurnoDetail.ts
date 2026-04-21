import { useQuery } from "@tanstack/react-query";
import { turnosAPI } from "@api/resources/catalogos/turnos.api";
import type { TurnoDetailResponse } from "@api/types";
import { turnosKeys } from "@features/admin/modules/catalogos/turnos/queries/turnos.keys";

export const useTurnoDetail = (turnoId?: number, enabled = true) => {
  const isEnabled = enabled && Boolean(turnoId);

  return useQuery<TurnoDetailResponse>({
    queryKey: turnosKeys.detail(turnoId!),
    queryFn: () => {
      if (!turnoId) throw new Error("turnoId es requerido");
      return turnosAPI.getById(turnoId);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
