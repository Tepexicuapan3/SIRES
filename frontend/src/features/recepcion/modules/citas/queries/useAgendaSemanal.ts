import { useQuery } from "@tanstack/react-query";
import { agendaAPI } from "@api/resources/agenda.api";

export const useAgendaSemanal = (
  medicoId: number | null,
  fechaDesde: string,
  fechaHasta: string,
  options?: { refetchInterval?: number },
) =>
  useQuery({
    queryKey:           ["agenda-semanal", medicoId, fechaDesde, fechaHasta],
    queryFn:            () => agendaAPI.getSemanal(medicoId!, fechaDesde, fechaHasta),
    enabled:            !!medicoId && !!fechaDesde && !!fechaHasta,
    staleTime:          0,
    refetchOnWindowFocus: true,
    refetchInterval:    options?.refetchInterval,
  });
