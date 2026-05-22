import { useMutation, useQueryClient } from "@tanstack/react-query";
import { citasAPI } from "@api/resources/citas.api";
import type { CreateCitaRequest, UpdateEstatusCitaRequest } from "@api/types";
import { CITAS_KEYS } from "@features/recepcion/modules/citas/queries/useCitasList";

const AGENDA_KEY = ["agenda-semanal"] as const;

export const useCreateCita = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCitaRequest) => citasAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CITAS_KEYS.all });
      qc.invalidateQueries({ queryKey: AGENDA_KEY });
    },
  });
};

export const useUpdateEstatusCita = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEstatusCitaRequest) => citasAPI.updateEstatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CITAS_KEYS.all });
      qc.invalidateQueries({ queryKey: AGENDA_KEY });
    },
  });
};
