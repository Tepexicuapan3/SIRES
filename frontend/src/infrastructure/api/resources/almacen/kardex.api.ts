import apiClient from "@api/client";
import type {
  CerrarConteoRequest,
  ConteoFisico,
  ConteosListParams,
  ConteosListResponse,
  ConsumoConsulta,
  ConsumosListParams,
  ConsumosListResponse,
  CreateConteoRequest,
  CreateConsumoRequest,
  CreateEntradaRequest,
  CreateSalidaRequest,
  DashboardStats,
  EntradaInventario,
  EntradasListParams,
  EntradasListResponse,
  ExistenciaAlmacen,
  ExistenciasListParams,
  ExistenciasListResponse,
  KardexListParams,
  KardexListResponse,
  KardexMovimiento,
  LoteInsumo,
  LotesListParams,
  LotesListResponse,
  SalidaInventario,
  SalidasListParams,
  SalidasListResponse,
} from "@api/types/almacen/kardex.types";

const BASE = "/almacen";

export const lotesAPI = {
  list: async (params: LotesListParams): Promise<LotesListResponse> =>
    (await apiClient.get<LotesListResponse>(`${BASE}/lotes/`, { params })).data,

  get: async (id: number): Promise<LoteInsumo> =>
    (await apiClient.get<LoteInsumo>(`${BASE}/lotes/${id}/`)).data,
};

export const entradasAPI = {
  list: async (params: EntradasListParams): Promise<EntradasListResponse> =>
    (await apiClient.get<EntradasListResponse>(`${BASE}/entradas/`, { params })).data,

  get: async (id: number): Promise<EntradaInventario> =>
    (await apiClient.get<EntradaInventario>(`${BASE}/entradas/${id}/`)).data,

  create: async (data: CreateEntradaRequest): Promise<EntradaInventario> =>
    (await apiClient.post<EntradaInventario>(`${BASE}/entradas/`, data)).data,
};

export const kardexAPI = {
  list: async (params: KardexListParams): Promise<KardexListResponse> =>
    (await apiClient.get<KardexListResponse>(`${BASE}/kardex/`, { params })).data,

  get: async (id: number): Promise<KardexMovimiento> =>
    (await apiClient.get<KardexMovimiento>(`${BASE}/kardex/${id}/`)).data,
};

export const existenciasAPI = {
  list: async (params: ExistenciasListParams): Promise<ExistenciasListResponse> =>
    (await apiClient.get<ExistenciasListResponse>(`${BASE}/existencias/`, { params })).data,

  get: async (id: number): Promise<ExistenciaAlmacen> =>
    (await apiClient.get<ExistenciaAlmacen>(`${BASE}/existencias/${id}/`)).data,
};

// ─── Phase 3: Salidas ────────────────────────────────────────────────────────

export const salidasAPI = {
  list: async (params: SalidasListParams): Promise<SalidasListResponse> =>
    (await apiClient.get<SalidasListResponse>(`${BASE}/salidas/`, { params })).data,

  get: async (id: number): Promise<SalidaInventario> =>
    (await apiClient.get<SalidaInventario>(`${BASE}/salidas/${id}/`)).data,

  create: async (data: CreateSalidaRequest): Promise<SalidaInventario> =>
    (await apiClient.post<SalidaInventario>(`${BASE}/salidas/`, data)).data,
};

// ─── Phase 4: Conteo Físico ──────────────────────────────────────────────────

export const conteosAPI = {
  list: async (params: ConteosListParams): Promise<ConteosListResponse> =>
    (await apiClient.get<ConteosListResponse>(`${BASE}/conteos/`, { params })).data,

  get: async (id: number): Promise<ConteoFisico> =>
    (await apiClient.get<ConteoFisico>(`${BASE}/conteos/${id}/`)).data,

  create: async (data: CreateConteoRequest): Promise<ConteoFisico> =>
    (await apiClient.post<ConteoFisico>(`${BASE}/conteos/`, data)).data,

  cerrar: async (id: number, data: CerrarConteoRequest): Promise<{ detail: string }> =>
    (await apiClient.post<{ detail: string }>(`${BASE}/conteos/${id}/cerrar/`, data)).data,
};

// ─── Phase 5: Dashboard ──────────────────────────────────────────────────────

export const dashboardAPI = {
  stats: async (): Promise<DashboardStats> =>
    (await apiClient.get<DashboardStats>(`${BASE}/dashboard/`)).data,
};

// ─── Phase 6: Consumos por Consulta ─────────────────────────────────────────

export const consumosAPI = {
  list: async (params: ConsumosListParams): Promise<ConsumosListResponse> =>
    (await apiClient.get<ConsumosListResponse>(`${BASE}/consumos/`, { params })).data,

  get: async (id: number): Promise<ConsumoConsulta> =>
    (await apiClient.get<ConsumoConsulta>(`${BASE}/consumos/${id}/`)).data,

  create: async (data: CreateConsumoRequest): Promise<ConsumoConsulta> =>
    (await apiClient.post<ConsumoConsulta>(`${BASE}/consumos/`, data)).data,
};
