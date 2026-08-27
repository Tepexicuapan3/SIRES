/**
 * Catalog Import API Resource
 *
 * Endpoints genericos de import masivo por Excel, compartidos por los
 * catalogos registrados en `CATALOG_IMPORT_REGISTRY` (backend): hoy
 * disabilities/specialties/schools. Un catalogo nuevo solo necesita su
 * entrada en el registro del backend y su `CatalogImportConfig` en el
 * frontend (`catalog-import.config.ts`) -- este cliente no cambia.
 *
 * NOTA SOBRE UPLOAD Y FORMDATA:
 * El interceptor global refresca el token en 401 pero no puede reenviar
 * FormData (stream consumido). Estos metodos esperan que el interceptor
 * haga el refresh y luego reintentan por su cuenta, reconstruyendo el
 * FormData en cada intento (mismo patron que `cies.api.ts`).
 *
 * NOTA SOBRE CONFIRM Y 409:
 * El backend responde 409 con el cuerpo `{ total_records, total_errores,
 * inserted: 0, rows, code: "IMPORT_HAS_ERRORS" }` cuando el todo-o-nada
 * rechaza el lote. El interceptor global normaliza cualquier error 4xx/5xx
 * a `ApiError` (solo conserva code/message/status/details) y ese cuerpo se
 * pierde. Como preview y confirm corren la MISMA validacion sobre el MISMO
 * archivo, ante un 409 reconstruimos las filas con error re-llamando a
 * `preview` en vez de propagar un error vacio de contenido.
 */

import apiClient from "@api/client";
import { ApiError } from "@api/utils/errors";

/* =======================
  Tipos
======================= */

export interface CatalogImportRow {
  ERROR: string;
  [key: string]: string | number;
}

export interface CatalogImportResponse {
  total_records: number;
  total_errores: number;
  inserted: number;
  rows: CatalogImportRow[];
}

/* =======================
   Helpers
======================= */

const waitForTokenRefresh = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 800));

const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

/* =======================
   API
======================= */

export const catalogImportAPI = {
  /**
   * Descarga la plantilla .xlsx del catalogo (headers generados desde el
   * mismo `spec.columns` que valida el backend).
   * @endpoint GET /api/v1/catalogos/{slug}/import/template/
   */
  downloadTemplate: async (slug: string): Promise<Blob> => {
    const response = await apiClient.get(`/${slug}/import/template/`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  /**
   * PASO 1 -- Preview: valida el Excel y devuelve las filas con error.
   * NO guarda nada en la BD.
   * @endpoint POST /api/v1/catalogos/{slug}/import/preview/
   */
  preview: async (
    slug: string,
    file: File,
    _retry = false,
  ): Promise<CatalogImportResponse> => {
    const buildFormData = () => {
      const formData = new FormData();
      formData.append("file", file);
      return formData;
    };

    try {
      const response = await apiClient.post<CatalogImportResponse>(
        `/${slug}/import/preview/`,
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
      if (!_retry && isApiError(err) && err.status === 401) {
        await waitForTokenRefresh();
        return catalogImportAPI.preview(slug, file, true);
      }
      throw err;
    }
  },

  /**
   * PASO 2 -- Confirm: reenvia el MISMO archivo (nunca filas del cliente).
   * El servidor re-corre la validacion como unica autoridad; todo-o-nada.
   * @endpoint POST /api/v1/catalogos/{slug}/import/confirm/
   */
  confirm: async (
    slug: string,
    file: File,
    _retry = false,
  ): Promise<CatalogImportResponse> => {
    const buildFormData = () => {
      const formData = new FormData();
      formData.append("file", file);
      return formData;
    };

    try {
      const response = await apiClient.post<CatalogImportResponse>(
        `/${slug}/import/confirm/`,
        buildFormData(),
        {
          headers: {
            "Content-Type": undefined,
          },
        },
      );
      return response.data;
    } catch (err: unknown) {
      if (!_retry && isApiError(err) && err.status === 401) {
        await waitForTokenRefresh();
        return catalogImportAPI.confirm(slug, file, true);
      }
      if (isApiError(err) && err.status === 409) {
        return catalogImportAPI.preview(slug, file);
      }
      throw err;
    }
  },
};
