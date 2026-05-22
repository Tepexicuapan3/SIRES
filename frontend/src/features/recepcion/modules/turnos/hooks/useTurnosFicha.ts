import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { turnosFichaAPI } from "@api/resources/turnos-ficha.api";
import type { CreateTurnoFichaRequest, UpdateTurnoFichaRequest } from "@api/types/turnos-ficha.types";

const KEYS = {
  all:    ["turnos-ficha"]         as const,
  actual: ["turnos-ficha", "actual"] as const,
};

export const useTurnosFichaList = () =>
  useQuery({
    queryKey: KEYS.all,
    queryFn:  turnosFichaAPI.getAll,
    staleTime: 60_000,
  });

export const useTurnoActual = () =>
  useQuery({
    queryKey:        KEYS.actual,
    queryFn:         turnosFichaAPI.getActual,
    staleTime:       30_000,
    refetchInterval: 60_000,  // refresca cada minuto
  });

export const useCreateTurnoFicha = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTurnoFichaRequest) => turnosFichaAPI.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useUpdateTurnoFicha = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTurnoFichaRequest) => turnosFichaAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.actual });
    },
  });
};
