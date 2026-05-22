import apiClient from "@api/client";
import type { AgendaSemanalResponse } from "@api/types/agenda.types";

export const agendaAPI = {
  getSemanal: async (
    medicoId: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<AgendaSemanalResponse> => {
    const r = await apiClient.get<AgendaSemanalResponse>("/citas/agenda", {
      params: { medicoId, fechaDesde, fechaHasta },
    });
    return r.data;
  },
};
