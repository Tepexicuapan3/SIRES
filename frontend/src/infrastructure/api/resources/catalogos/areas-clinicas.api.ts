/**
 * Áreas Clínicas API Resource
 *
 * cat_areas_clinicas:
 * - GET    /clinical-areas/
 * - POST   /clinical-areas/
 * - GET    /clinical-areas/:id
 * - PUT    /clinical-areas/:id
 * - DELETE /clinical-areas/:id
 *
 * centro_area_clinica:
 * - GET    /care-center-clinical-areas/
 * - POST   /care-center-clinical-areas/
 * - GET    /care-center-clinical-areas/:centerId/:areaId
 * - PUT    /care-center-clinical-areas/:centerId/:areaId
 * - DELETE /care-center-clinical-areas/:centerId/:areaId
 */

import apiClient from "@api/client";
import type {
  AreasClinicasListParams,
  AreasClinicasListResponse,
  AreaClinicaDetailResponse,
  CreateAreaClinicaRequest,
  CreateAreaClinicaResponse,
  UpdateAreaClinicaRequest,
  UpdateAreaClinicaResponse,
  DeleteAreaClinicaResponse,
  CentrosAreasClinicasListParams,
  CentrosAreasClinicasListResponse,
  CentroAreaClinicaDetailResponse,
  CreateCentroAreaClinicaRequest,
  CreateCentroAreaClinicaResponse,
  UpdateCentroAreaClinicaRequest,
  UpdateCentroAreaClinicaResponse,
  DeleteCentroAreaClinicaResponse,
} from "@api/types";

export const areasClinicasAPI = {
  getAll: async (params?: AreasClinicasListParams): Promise<AreasClinicasListResponse> => {
    const response = await apiClient.get<AreasClinicasListResponse>("/clinical-areas/", { params });
    return response.data;
  },

  getById: async (areaId: number): Promise<AreaClinicaDetailResponse> => {
    const response = await apiClient.get<AreaClinicaDetailResponse>(`/clinical-areas/${areaId}/`);
    return response.data;
  },

  create: async (data: CreateAreaClinicaRequest): Promise<CreateAreaClinicaResponse> => {
    const response = await apiClient.post<CreateAreaClinicaResponse>("/clinical-areas/", data);
    return response.data;
  },

  update: async (areaId: number, data: UpdateAreaClinicaRequest): Promise<UpdateAreaClinicaResponse> => {
    const response = await apiClient.put<UpdateAreaClinicaResponse>(`/clinical-areas/${areaId}/`, data);
    return response.data;
  },

  delete: async (areaId: number): Promise<DeleteAreaClinicaResponse> => {
    const response = await apiClient.delete<DeleteAreaClinicaResponse>(`/clinical-areas/${areaId}/`);
    return response.data;
  },
};

export const centroAreaClinicaAPI = {
  getAll: async (params?: CentrosAreasClinicasListParams): Promise<CentrosAreasClinicasListResponse> => {
    const response = await apiClient.get<CentrosAreasClinicasListResponse>("/care-center-clinical-areas/", { params });
    return response.data;
  },

  getByKey: async (centerId: number, areaId: number): Promise<CentroAreaClinicaDetailResponse> => {
    const response = await apiClient.get<CentroAreaClinicaDetailResponse>(
      `/care-center-clinical-areas/${centerId}/${areaId}/`,
    );
    return response.data;
  },

  create: async (data: CreateCentroAreaClinicaRequest): Promise<CreateCentroAreaClinicaResponse> => {
    const response = await apiClient.post<CreateCentroAreaClinicaResponse>(
      "/care-center-clinical-areas/",
      data,
    );
    return response.data;
  },

  update: async (
    centerId: number,
    areaId: number,
    data: UpdateCentroAreaClinicaRequest,
  ): Promise<UpdateCentroAreaClinicaResponse> => {
    const response = await apiClient.put<UpdateCentroAreaClinicaResponse>(
      `/care-center-clinical-areas/${centerId}/${areaId}/`,
      data,
    );
    return response.data;
  },

  delete: async (centerId: number, areaId: number): Promise<DeleteCentroAreaClinicaResponse> => {
    const response = await apiClient.delete<DeleteCentroAreaClinicaResponse>(
      `/care-center-clinical-areas/${centerId}/${areaId}/`,
    );
    return response.data;
  },
};
