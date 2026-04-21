import { useQuery } from "@tanstack/react-query";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type { CentroAtencionHorarioDetailResponse } from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";

export const useCentroAtencionHorarioDetail = (
  scheduleId?: number,
  enabled = true,
) => {
  const isEnabled = enabled && Boolean(scheduleId);

  return useQuery<CentroAtencionHorarioDetailResponse>({
    queryKey: centrosAtencionKeys.schedules.detail(scheduleId!),
    queryFn: () => {
      if (!scheduleId) throw new Error("scheduleId es requerido");
      return centrosAtencionAPI.getScheduleById(scheduleId);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
};
