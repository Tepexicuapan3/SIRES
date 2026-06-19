import apiClient from "@api/client";
import type {
  Almacen,
  AlmacenesListParams,
  AlmacenesListResponse,
  CatCategoriaInsumo,
  CatInsumo,
  CatProveedor,
  CatUnidadMedida,
  CatalogosBaseListParams,
  CreateAlmacenRequest,
  CreateCategoriaInsumoRequest,
  CreateInsumoRequest,
  CreateProveedorRequest,
  CreateUnidadMedidaRequest,
  InsumosListParams,
  InsumosListResponse,
  CategoriasInsumoListResponse,
  ProveedoresListResponse,
  UnidadesMedidaListResponse,
  UpdateAlmacenRequest,
  UpdateCategoriaInsumoRequest,
  UpdateInsumoRequest,
  UpdateProveedorRequest,
  UpdateUnidadMedidaRequest,
} from "@api/types";

const BASE = "/almacen";

export const unidadesMedidaAPI = {
  getAll:    async (params?: CatalogosBaseListParams): Promise<UnidadesMedidaListResponse> =>
    (await apiClient.get<UnidadesMedidaListResponse>(`${BASE}/unidades-medida/`, { params })).data,
  getById:   async (id: number): Promise<CatUnidadMedida> =>
    (await apiClient.get<CatUnidadMedida>(`${BASE}/unidades-medida/${id}/`)).data,
  create:    async (data: CreateUnidadMedidaRequest): Promise<CatUnidadMedida> =>
    (await apiClient.post<CatUnidadMedida>(`${BASE}/unidades-medida/`, data)).data,
  update:    async (id: number, data: UpdateUnidadMedidaRequest): Promise<CatUnidadMedida> =>
    (await apiClient.patch<CatUnidadMedida>(`${BASE}/unidades-medida/${id}/`, data)).data,
  delete:    async (id: number): Promise<void> => { await apiClient.delete(`${BASE}/unidades-medida/${id}/`); },
};

export const categoriasInsumoAPI = {
  getAll:    async (params?: CatalogosBaseListParams): Promise<CategoriasInsumoListResponse> =>
    (await apiClient.get<CategoriasInsumoListResponse>(`${BASE}/categorias/`, { params })).data,
  getById:   async (id: number): Promise<CatCategoriaInsumo> =>
    (await apiClient.get<CatCategoriaInsumo>(`${BASE}/categorias/${id}/`)).data,
  create:    async (data: CreateCategoriaInsumoRequest): Promise<CatCategoriaInsumo> =>
    (await apiClient.post<CatCategoriaInsumo>(`${BASE}/categorias/`, data)).data,
  update:    async (id: number, data: UpdateCategoriaInsumoRequest): Promise<CatCategoriaInsumo> =>
    (await apiClient.patch<CatCategoriaInsumo>(`${BASE}/categorias/${id}/`, data)).data,
  delete:    async (id: number): Promise<void> => { await apiClient.delete(`${BASE}/categorias/${id}/`); },
};

export const proveedoresAPI = {
  getAll:    async (params?: CatalogosBaseListParams): Promise<ProveedoresListResponse> =>
    (await apiClient.get<ProveedoresListResponse>(`${BASE}/proveedores/`, { params })).data,
  getById:   async (id: number): Promise<CatProveedor> =>
    (await apiClient.get<CatProveedor>(`${BASE}/proveedores/${id}/`)).data,
  create:    async (data: CreateProveedorRequest): Promise<CatProveedor> =>
    (await apiClient.post<CatProveedor>(`${BASE}/proveedores/`, data)).data,
  update:    async (id: number, data: UpdateProveedorRequest): Promise<CatProveedor> =>
    (await apiClient.patch<CatProveedor>(`${BASE}/proveedores/${id}/`, data)).data,
  delete:    async (id: number): Promise<void> => { await apiClient.delete(`${BASE}/proveedores/${id}/`); },
};

export const insumosAPI = {
  getAll:    async (params?: InsumosListParams): Promise<InsumosListResponse> =>
    (await apiClient.get<InsumosListResponse>(`${BASE}/insumos/`, { params })).data,
  getById:   async (id: number): Promise<CatInsumo> =>
    (await apiClient.get<CatInsumo>(`${BASE}/insumos/${id}/`)).data,
  create:    async (data: CreateInsumoRequest): Promise<CatInsumo> =>
    (await apiClient.post<CatInsumo>(`${BASE}/insumos/`, data)).data,
  update:    async (id: number, data: UpdateInsumoRequest): Promise<CatInsumo> =>
    (await apiClient.patch<CatInsumo>(`${BASE}/insumos/${id}/`, data)).data,
  delete:    async (id: number): Promise<void> => { await apiClient.delete(`${BASE}/insumos/${id}/`); },
};

export const almacenesAPI = {
  getAll:    async (params?: AlmacenesListParams): Promise<AlmacenesListResponse> =>
    (await apiClient.get<AlmacenesListResponse>(`${BASE}/almacenes/`, { params })).data,
  getById:   async (id: number): Promise<Almacen> =>
    (await apiClient.get<Almacen>(`${BASE}/almacenes/${id}/`)).data,
  create:    async (data: CreateAlmacenRequest): Promise<Almacen> =>
    (await apiClient.post<Almacen>(`${BASE}/almacenes/`, data)).data,
  update:    async (id: number, data: UpdateAlmacenRequest): Promise<Almacen> =>
    (await apiClient.patch<Almacen>(`${BASE}/almacenes/${id}/`, data)).data,
  delete:    async (id: number): Promise<void> => { await apiClient.delete(`${BASE}/almacenes/${id}/`); },
};
