import apiClient from "@api/client";
import type {
  TurnoFichaConfig,
  TurnoActualResponse,
  CreateTurnoFichaRequest,
  UpdateTurnoFichaRequest,
} from "@api/types/turnos-ficha.types";

export const turnosFichaAPI = {
  getAll: async (): Promise<TurnoFichaConfig[]> => {
    const r = await apiClient.get<TurnoFichaConfig[]>("/turnos-ficha");
    return r.data;
  },

  create: async (data: CreateTurnoFichaRequest): Promise<TurnoFichaConfig> => {
    const r = await apiClient.post<TurnoFichaConfig>("/turnos-ficha", data);
    return r.data;
  },

  update: async (id: number, data: UpdateTurnoFichaRequest): Promise<TurnoFichaConfig> => {
    const r = await apiClient.patch<TurnoFichaConfig>(`/turnos-ficha/${id}`, data);
    return r.data;
  },

  getActual: async (): Promise<TurnoActualResponse> => {
    const r = await apiClient.get<TurnoActualResponse>("/turnos-ficha/actual");
    return r.data;
  },
};
