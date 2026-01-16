/**
 * Clinicas API Resource
 *
 * Endpoints para gestión de catálogo de clínicas.
 * Las clínicas son puntos de atención médica del Metro CDMX.
 */

import apiClient from "@api/client";
import type {
  Clinica,
  ClinicasListResponse,
} from "@api/schemas/clinicas.schema";

export const clinicasAPI = {
  /**
   * GET /api/v1/clinicas
   * Obtiene lista de clínicas activas ordenadas por nombre
   *
   * @returns Promise<Clinica[]> - Lista de clínicas
   * @throws Error si el backend retorna formato inesperado
   */
  getClinicas: async (): Promise<Clinica[]> => {
    const response = await apiClient.get<ClinicasListResponse>("/clinicas");
    return response.data.items;
  },
};
