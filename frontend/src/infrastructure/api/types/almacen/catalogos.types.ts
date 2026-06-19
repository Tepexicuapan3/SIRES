import type { ListResponse } from "@api/types/common.types";

// ── Enums ────────────────────────────────────────────────────────────────────

export const ALMACEN_TIPO = {
  GENERAL:     "GENERAL",
  CONSULTORIO: "CONSULTORIO",
  FARMACIA:    "FARMACIA",
  MEDICO:      "MEDICO",
} as const;

export type AlmacenTipo = (typeof ALMACEN_TIPO)[keyof typeof ALMACEN_TIPO];

export const ALMACEN_TIPO_LABELS: Record<AlmacenTipo, string> = {
  GENERAL:     "General",
  CONSULTORIO: "Consultorio",
  FARMACIA:    "Farmacia",
  MEDICO:      "Médico",
};

// ── Entidades ─────────────────────────────────────────────────────────────────

export interface CatUnidadMedida {
  id:          number;
  nombre:      string;
  abreviacion: string;
  isActive:    boolean;
  createdAt:   string;
}

export interface CatCategoriaInsumo {
  id:          number;
  nombre:      string;
  descripcion: string;
  isActive:    boolean;
  createdAt:   string;
}

export interface CatProveedor {
  id:        number;
  nombre:    string;
  contacto:  string;
  telefono:  string;
  correo:    string;
  direccion: string;
  rfc:       string;
  isActive:  boolean;
  createdAt: string;
}

export interface CatInsumo {
  id:               number;
  nombre:           string;
  codigo:           string;
  codigoBarras:     string;
  descripcion:      string;
  idCategoria:      number;
  categoriaLabel:   string;
  idUnidad:         number;
  unidadLabel:      string;
  stockMinimo:      string;
  requiereLote:     boolean;
  requiereCaducidad: boolean;
  isActive:         boolean;
  createdAt:        string;
}

export interface Almacen {
  id:               number;
  nombre:           string;
  tipo:             AlmacenTipo;
  tipoLabel:        string;
  idCentroAtencion: number;
  centroLabel:      string;
  descripcion:      string;
  isActive:         boolean;
  createdAt:        string;
}

// ── Requests ──────────────────────────────────────────────────────────────────

export interface CreateUnidadMedidaRequest {
  nombre:      string;
  abreviacion: string;
}

export interface CreateCategoriaInsumoRequest {
  nombre:      string;
  descripcion?: string;
}

export interface CreateProveedorRequest {
  nombre:    string;
  contacto?: string;
  telefono?: string;
  correo?:   string;
  direccion?: string;
  rfc?:      string;
}

export interface CreateInsumoRequest {
  nombre:            string;
  codigo:            string;
  codigoBarras?:     string;
  descripcion?:      string;
  idCategoria:       number;
  idUnidad:          number;
  stockMinimo?:      string;
  requiereLote?:     boolean;
  requiereCaducidad?: boolean;
}

export interface CreateAlmacenRequest {
  nombre:           string;
  tipo:             AlmacenTipo;
  idCentroAtencion: number;
  descripcion?:     string;
}

export type UpdateUnidadMedidaRequest    = Partial<CreateUnidadMedidaRequest>    & { isActive?: boolean };
export type UpdateCategoriaInsumoRequest = Partial<CreateCategoriaInsumoRequest> & { isActive?: boolean };
export type UpdateProveedorRequest       = Partial<CreateProveedorRequest>       & { isActive?: boolean };
export type UpdateInsumoRequest          = Partial<CreateInsumoRequest>          & { isActive?: boolean };
export type UpdateAlmacenRequest         = Partial<CreateAlmacenRequest>         & { isActive?: boolean };

// ── Params de listado ─────────────────────────────────────────────────────────

export interface CatalogosBaseListParams {
  page?:           number;
  pageSize?:       number;
  search?:         string;
  ordering?:       string;
  includeInactive?: boolean;
}

export interface InsumosListParams extends CatalogosBaseListParams {
  categoriaId?: number;
  requiereLote?: boolean;
}

export interface AlmacenesListParams extends CatalogosBaseListParams {
  tipo?:     AlmacenTipo;
  centroId?: number;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export type UnidadesMedidaListResponse  = ListResponse<CatUnidadMedida>;
export type CategoriasInsumoListResponse = ListResponse<CatCategoriaInsumo>;
export type ProveedoresListResponse     = ListResponse<CatProveedor>;
export type InsumosListResponse         = ListResponse<CatInsumo>;
export type AlmacenesListResponse       = ListResponse<Almacen>;
