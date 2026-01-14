/**
 * Clinicas API Resource
 *
 * Endpoints para gestión de catálogo de clínicas.
 * Las clínicas son puntos de atención médica del Metro CDMX.
 */

import apiClient from "@api/client";
import type { Clinica } from "@api/types/clinicas.types";

/**
 * Response del endpoint GET /api/v1/clinicas
 */
interface ClinicasResponse {
  clinicas: Clinica[];
}

export const clinicasAPI = {
  /**
   * GET /api/v1/clinicas
   * Obtiene lista de clínicas activas ordenadas por nombre
   *
   * @returns Promise<Clinica[]> - Lista de clínicas
   * @throws Error si el backend retorna formato inesperado
   */
  getClinicas: async (): Promise<Clinica[]> => {
    const response = await apiClient.get<ClinicasResponse>("/clinicas");

    // Validación defensiva - asegurar que el backend retornó el formato esperado
    if (!response.data || !Array.isArray(response.data.clinicas)) {
      throw new Error("Formato inválido de respuesta del servidor");
    }

    return response.data.clinicas;
  },
};
