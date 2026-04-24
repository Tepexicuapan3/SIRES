/**
 * Turnos API Resource
 *
 * Endpoints:
 * - GET    /shifts/
 * - POST   /shifts/
 * - GET    /shifts/:id
 * - PUT    /shifts/:id
 * - DELETE /shifts/:id
 */

import apiClient from "@api/client";
import type {
  TurnosListParams,
  TurnosListResponse,
  TurnoDetailResponse,
  CreateTurnoRequest,
  CreateTurnoResponse,
  UpdateTurnoRequest,
  UpdateTurnoResponse,
  DeleteTurnoResponse,
} from "@api/types";

export const turnosAPI = {
  getAll: async (params?: TurnosListParams): Promise<TurnosListResponse> => {
    const response = await apiClient.get<TurnosListResponse>("/shifts/", {
      params,
    });
    return response.data;
  },

  getById: async (turnoId: number): Promise<TurnoDetailResponse> => {
    const response = await apiClient.get<TurnoDetailResponse>(
      `/shifts/${turnoId}/`,
    );
    return response.data;
  },

  create: async (data: CreateTurnoRequest): Promise<CreateTurnoResponse> => {
    const response = await apiClient.post<CreateTurnoResponse>("/shifts/", data);
    return response.data;
  },

  update: async (
    turnoId: number,
    data: UpdateTurnoRequest,
  ): Promise<UpdateTurnoResponse> => {
    const response = await apiClient.put<UpdateTurnoResponse>(
      `/shifts/${turnoId}/`,
      data,
    );
    return response.data;
  },

  delete: async (turnoId: number): Promise<DeleteTurnoResponse> => {
    const response = await apiClient.delete<DeleteTurnoResponse>(
      `/shifts/${turnoId}/`,
    );
    return response.data;
  },
};
