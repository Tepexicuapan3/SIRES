/**
 * Centros de Atencion API Resource
 *
 * Endpoints para gestion completa de centros de atencion (CRUD).
 * Incluye clinicas, hospitales y sanatorios.
 */

import apiClient from "@api/client";
import type {
  CentrosAtencionListParams,
  CentrosAtencionListResponse,
  CentroAtencionDetailResponse,
  CreateCentroAtencionRequest,
  CreateCentroAtencionResponse,
  UpdateCentroAtencionRequest,
  UpdateCentroAtencionResponse,
  DeleteCentroAtencionResponse,
} from "@api/types";

type ApiCentroAtencionListItem = Omit<
  CentrosAtencionListResponse["items"][number],
  "folioCode"
> & {
  code: string;
};

type ApiCentroAtencionDetail = Omit<
  CentroAtencionDetailResponse["center"],
  "folioCode"
> & {
  code: string;
};

type ApiCentrosAtencionListResponse = Omit<CentrosAtencionListResponse, "items"> & {
  items: ApiCentroAtencionListItem[];
};

type ApiCentroAtencionDetailResponse = {
  center: ApiCentroAtencionDetail;
};

type ApiUpdateCentroAtencionResponse = {
  center: ApiCentroAtencionDetail;
};

type ApiCreateCentroAtencionRequest = Omit<CreateCentroAtencionRequest, "folioCode"> & {
  code: string;
};

type ApiUpdateCentroAtencionRequest = Omit<UpdateCentroAtencionRequest, "folioCode"> & {
  code?: string;
};

const mapCenterFromApi = <T extends { code: string }>(
  center: T,
): Omit<T, "code"> & { folioCode: string } => {
  const { code, ...rest } = center;
  return {
    ...rest,
    folioCode: code,
  };
};

const mapCreatePayloadToApi = (
  payload: CreateCentroAtencionRequest,
): ApiCreateCentroAtencionRequest => {
  const { folioCode, ...rest } = payload;
  return {
    ...rest,
    code: folioCode,
  };
};

const mapUpdatePayloadToApi = (
  payload: UpdateCentroAtencionRequest,
): ApiUpdateCentroAtencionRequest => {
  const { folioCode, ...rest } = payload;
  return {
    ...rest,
    ...(folioCode !== undefined ? { code: folioCode } : {}),
  };
};

export const centrosAtencionAPI = {
  // ==========================================
  // 1. CORE: CRUD
  // ==========================================

  /**
   * Listar centros de atencion con paginacion y filtros.
   * @endpoint GET /api/v1/care-centers
   * @permission admin:catalogos:centros_atencion:read
   */
  getAll: async (
    params?: CentrosAtencionListParams,
  ): Promise<CentrosAtencionListResponse> => {
    const response = await apiClient.get<ApiCentrosAtencionListResponse>(
      "/care-centers",
      {
        params,
      },
    );
    return {
      ...response.data,
      items: response.data.items.map((item) => mapCenterFromApi(item)),
    };
  },

  /**
   * Obtener detalle completo de un centro de atencion.
   * @endpoint GET /api/v1/care-centers/:id
   * @permission admin:catalogos:centros_atencion:read
   */
  getById: async (centerId: number): Promise<CentroAtencionDetailResponse> => {
    const response = await apiClient.get<ApiCentroAtencionDetailResponse>(
      `/care-centers/${centerId}`,
    );
    return {
      center: mapCenterFromApi(response.data.center),
    };
  },

  /**
   * Crear centro de atencion.
   * @endpoint POST /api/v1/care-centers
   * @permission admin:catalogos:centros_atencion:create
   */
  create: async (
    data: CreateCentroAtencionRequest,
  ): Promise<CreateCentroAtencionResponse> => {
    const response = await apiClient.post<CreateCentroAtencionResponse>(
      "/care-centers",
      mapCreatePayloadToApi(data),
    );
    return response.data;
  },

  /**
   * Actualizar centro de atencion.
   * @endpoint PUT /api/v1/care-centers/:id
   * @permission admin:catalogos:centros_atencion:update
   */
  update: async (
    centerId: number,
    data: UpdateCentroAtencionRequest,
  ): Promise<UpdateCentroAtencionResponse> => {
    const response = await apiClient.put<ApiUpdateCentroAtencionResponse>(
      `/care-centers/${centerId}`,
      mapUpdatePayloadToApi(data),
    );
    return {
      center: mapCenterFromApi(response.data.center),
    };
  },

  /**
   * Eliminar centro de atencion (baja logica).
   * @endpoint DELETE /api/v1/care-centers/:id
   * @permission admin:catalogos:centros_atencion:delete
   */
  delete: async (centerId: number): Promise<DeleteCentroAtencionResponse> => {
    const response = await apiClient.delete<DeleteCentroAtencionResponse>(
      `/care-centers/${centerId}`,
    );
    return response.data;
  },
};
