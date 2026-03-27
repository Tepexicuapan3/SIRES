/**
 * CIES API Resource
 *
 * Endpoints para carga masiva y consulta del catálogo CIE.
 *
 * NOTA SOBRE UPLOAD Y FORMDATA:
 * El interceptor global refresca el token en 401 pero no puede
 * reenviar FormData (stream consumido). Este método espera que
 * el interceptor haga el refresh y luego reintenta por su cuenta.
 */

import apiClient from "@api/client";

/* =======================
  Tipos
======================= */

export interface CiesListItem {
  code: string;
  description: string;
  version: string;
  is_active: boolean;
}

export interface CiesListResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: CiesListItem[];
}

export interface CiesUploadRow {
  CLAVE: string;
  DESCRIPCION: string;
  VERSION: string;
  ERROR: string;
}

/** Respuesta del paso 1 — preview: NO guarda nada, inserted siempre 0 */
export interface CiesPreviewResponse {
  total_records: number;
  total_errores: number;
  inserted: 0;
  rows: CiesUploadRow[];
}

/** Respuesta del paso 2 — confirm: guarda en BD */
export interface CiesConfirmResponse {
  total_records: number;
  total_errores: number;
  inserted: number;
}

interface ApiErrorWithStatus {
  status?: number;
}

/* =======================
   Helpers
======================= */

const waitForTokenRefresh = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 800));

const hasStatus = (error: unknown): error is ApiErrorWithStatus =>
  typeof error === "object" && error !== null && "status" in error;

/* =======================
   API
======================= */

export const ciesAPI = {
  /**
   * Listar claves CIE.
   * @endpoint GET /api/v1/catalogos/cies/
   */
  list: async (): Promise<CiesListResponse> => {
    const response = await apiClient.get<CiesListResponse>("/cies/");
    return response.data;
  },

  /**
   * PASO 1 — Preview: valida el Excel y devuelve filas con errores.
   * NO guarda nada en la BD.
   * @endpoint POST /api/v1/catalogos/cies/upload/
   */
  preview: async (
    file: File,
    version: string = "CIE-10",
    _retry = false,
  ): Promise<CiesPreviewResponse> => {
    const buildFormData = () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("version", version);
      return formData;
    };

    try {
      const response = await apiClient.post<CiesPreviewResponse>(
        "/cies/upload/",
        buildFormData(),
        {
          headers: {
            // Elimina Content-Type: application/json del cliente base.
            // Axios genera multipart/form-data con boundary correcto.
            "Content-Type": undefined,
          },
        },
      );
      return response.data;
    } catch (err: unknown) {
      if (!_retry && hasStatus(err) && err.status === 401) {
        await waitForTokenRefresh();
        return ciesAPI.preview(file, version, true);
      }
      throw err;
    }
  },

  /**
   * PASO 2 — Confirm: guarda las filas válidas en la BD.
   * Recibe las rows que el frontend ya tiene en memoria del paso 1.
   * @endpoint POST /api/v1/catalogos/cies/confirm/
   */
  confirm: async (rows: CiesUploadRow[]): Promise<CiesConfirmResponse> => {
    const response = await apiClient.post<CiesConfirmResponse>(
      "/cies/confirm/",
      { rows },
    );
    return response.data;
  },

  /**
   * Obtener detalle de una clave CIE.
   * @endpoint GET /api/v1/catalogos/cies/:code/
   */
  getByCode: async (code: string): Promise<CiesListItem> => {
    const response = await apiClient.get<CiesListItem>(`/cies/${code}/`);
    return response.data;
  },

  /**
   * Actualizar una clave CIE.
   * @endpoint PATCH /api/v1/catalogos/cies/:code/
   */
  update: async (
    code: string,
    data: Partial<CiesListItem>,
  ): Promise<CiesListItem> => {
    const response = await apiClient.patch<CiesListItem>(
      `/cies/${code}/`,
      data,
    );
    return response.data;
  },

  /**
   * Eliminar una clave CIE.
   * @endpoint DELETE /api/v1/catalogos/cies/:code/
   */
  remove: async (code: string): Promise<void> => {
    await apiClient.delete(`/cies/${code}/`);
  },
};
