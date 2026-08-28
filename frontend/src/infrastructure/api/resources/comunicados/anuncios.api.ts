/**
 * Comunicados / Anuncios API Resource
 *
 * CRUD del banner de anuncios que se muestra en el portal de citas.
 * Endpoint: /api/v1/comunicados/anuncios/
 *
 * NOTA SOBRE UPLOAD Y FORMDATA:
 * El interceptor global refresca el token en 401 pero no puede
 * reenviar FormData (stream consumido). create/update esperan que
 * el interceptor haga el refresh y luego reintentan por su cuenta
 * (mismo patrón que `catalogos/cies.api.ts`).
 */

import apiClient from "@api/client";
import type {
  AnunciosListParams,
  AnunciosListResponse,
  AnuncioDetailResponse,
  AnuncioFormValues,
  CreateAnuncioResponse,
  DeleteAnuncioResponse,
  UpdateAnuncioResponse,
} from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";

interface ApiErrorWithStatus {
  status?: number;
}

const waitForTokenRefresh = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 800));

const hasStatus = (error: unknown): error is ApiErrorWithStatus =>
  typeof error === "object" && error !== null && "status" in error;

const buildAnuncioFormData = (
  values: Partial<AnuncioFormValues>,
): FormData => {
  const formData = new FormData();

  if (values.titulo !== undefined) formData.append("titulo", values.titulo);
  if (values.descripcion !== undefined)
    formData.append("descripcion", values.descripcion);
  if (values.enlaceUrl !== undefined)
    formData.append("enlaceUrl", values.enlaceUrl);
  if (values.vigenciaDesde !== undefined)
    formData.append("vigenciaDesde", values.vigenciaDesde);
  if (values.vigenciaHasta !== undefined)
    formData.append("vigenciaHasta", values.vigenciaHasta);
  if (values.orden !== undefined)
    formData.append("orden", String(values.orden));
  if (values.activo !== undefined)
    formData.append("activo", String(values.activo));
  if (values.imagen) formData.append("imagen", values.imagen);
  if (values.adjuntoPdf) formData.append("adjuntoPdf", values.adjuntoPdf);

  return formData;
};

const multipartHeaders = {
  // Elimina Content-Type: application/json del cliente base.
  // Axios genera multipart/form-data con boundary correcto.
  "Content-Type": undefined,
};

export const anunciosAPI = {
  /**
   * Listar anuncios (incluye inactivos/no vigentes; el borrado lógico se
   * excluye siempre del lado del backend).
   * @endpoint GET /api/v1/comunicados/anuncios/
   */
  getAll: async (
    params?: AnunciosListParams,
  ): Promise<AnunciosListResponse> => {
    const response = await apiClient.get<AnunciosListResponse>(
      "/comunicados/anuncios/",
      { params },
    );
    return response.data;
  },

  /**
   * Obtener detalle de un anuncio.
   * @endpoint GET /api/v1/comunicados/anuncios/:id/
   */
  getById: async (id: number): Promise<AnuncioDetailResponse> => {
    const response = await apiClient.get<AnuncioDetailResponse>(
      `/comunicados/anuncios/${id}/`,
    );
    return response.data;
  },

  /**
   * Crear un anuncio (multipart: imagen obligatoria, PDF opcional).
   * @endpoint POST /api/v1/comunicados/anuncios/
   */
  create: async (
    data: AnuncioFormValues,
    _retry = false,
  ): Promise<CreateAnuncioResponse> => {
    try {
      const response = await apiClient.post<CreateAnuncioResponse>(
        "/comunicados/anuncios/",
        buildAnuncioFormData(data),
        { headers: multipartHeaders },
      );
      return response.data;
    } catch (err: unknown) {
      if (!_retry && hasStatus(err) && err.status === 401) {
        await waitForTokenRefresh();
        return anunciosAPI.create(data, true);
      }
      throw err;
    }
  },

  /**
   * Actualizar un anuncio (multipart parcial: solo se envían los campos
   * provistos; si no se selecciona un nuevo archivo, no se reemplaza).
   * @endpoint PATCH /api/v1/comunicados/anuncios/:id/
   */
  update: async (
    id: number,
    data: Partial<AnuncioFormValues>,
    _retry = false,
  ): Promise<UpdateAnuncioResponse> => {
    try {
      const response = await apiClient.patch<UpdateAnuncioResponse>(
        `/comunicados/anuncios/${id}/`,
        buildAnuncioFormData(data),
        { headers: multipartHeaders },
      );
      return response.data;
    } catch (err: unknown) {
      if (!_retry && hasStatus(err) && err.status === 401) {
        await waitForTokenRefresh();
        return anunciosAPI.update(id, data, true);
      }
      throw err;
    }
  },

  /**
   * Eliminar (borrado lógico) un anuncio.
   * @endpoint DELETE /api/v1/comunicados/anuncios/:id/
   */
  delete: async (id: number): Promise<DeleteAnuncioResponse> => {
    const response = await apiClient.delete<DeleteAnuncioResponse>(
      `/comunicados/anuncios/${id}/`,
    );
    return response.data;
  },
};
