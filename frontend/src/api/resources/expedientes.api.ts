import apiClient from '../client';
import type {
  ExpedienteResponse,
  ActualizarExpedienteRequest,
  ActualizarExpedienteResponse,
} from '../types/expedientes.types';

export const expedientesAPI = {
  buscar: async (idEmpleado: string): Promise<ExpedienteResponse> => {
    const res = await apiClient.get<ExpedienteResponse>(
      '/expedientes/',
      { params: { id_empleado: idEmpleado } },
    );
    return res.data;
  },

  actualizar: async (
    data: ActualizarExpedienteRequest,
  ): Promise<ActualizarExpedienteResponse> => {
    const res = await apiClient.post<ActualizarExpedienteResponse>(
      '/expedientes/actualizar/',
      data,
    );
    return res.data;
  },
};