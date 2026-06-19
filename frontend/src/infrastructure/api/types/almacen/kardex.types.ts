import type { ListResponse, PaginationParams } from "@api/types/common.types";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const TIPO_MOVIMIENTO = {
  ENTRADA:          "ENTRADA",
  SALIDA:           "SALIDA",
  DEVOLUCION:       "DEVOLUCION",
  MERMA:            "MERMA",
  AJUSTE_POSITIVO:  "AJUSTE_POSITIVO",
  AJUSTE_NEGATIVO:  "AJUSTE_NEGATIVO",
  CONSUMO:          "CONSUMO",
} as const;

export type TipoMovimiento = (typeof TIPO_MOVIMIENTO)[keyof typeof TIPO_MOVIMIENTO];

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  ENTRADA:          "Entrada",
  SALIDA:           "Salida",
  DEVOLUCION:       "Devolución",
  MERMA:            "Merma",
  AJUSTE_POSITIVO:  "Ajuste positivo",
  AJUSTE_NEGATIVO:  "Ajuste negativo",
  CONSUMO:          "Consumo consulta",
};

// ─── Entities ────────────────────────────────────────────────────────────────

export interface LoteInsumo {
  id:             number;
  idInsumo:       number;
  insumoNombre:   string;
  idProveedor:    number | null;
  numLote:        string;
  fechaCaducidad: string | null;
  fchAlta:        string;
}

export interface EntradaDetalle {
  id:            number;
  idInsumo:      number;
  insumoNombre:  string;
  idLote:        number | null;
  numLote:       string;
  cantidad:      string;
  costoUnitario: string | null;
}

export interface EntradaInventario {
  id:            number;
  idAlmacen:     number;
  almacenNombre: string;
  idProveedor:   number | null;
  numRemision:   string;
  fchEntrada:    string;
  observaciones: string;
  isActive:      boolean;
  createdAt:     string;
  detalles:      EntradaDetalle[];
}

export interface KardexMovimiento {
  id:              number;
  idInsumo:        number;
  insumoNombre:    string;
  idLote:          number | null;
  numLote:         string;
  idAlmacen:       number;
  tipoMovimiento:  TipoMovimiento;
  cantidad:        string;
  saldoResultante: string;
  refModelo:       string;
  refId:           number;
  fchMovimiento:   string;
}

export interface ExistenciaAlmacen {
  id:            number;
  idInsumo:      number;
  insumoNombre:  string;
  insumoCode:    string;
  idLote:        number | null;
  numLote:       string;
  caducidad:     string | null;
  idAlmacen:     number;
  almacenNombre: string;
  cantidad:      string;
  stockMinimo:   string;
  bajoCritico:   boolean;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface LoteDatosInline {
  numLote:        string;
  fechaCaducidad?: string | null;
}

export interface CreateEntradaDetalleRequest {
  idInsumo:      number;
  idLote?:       number | null;
  loteDatos?:    LoteDatosInline | null;
  cantidad:      string;
  costoUnitario?: string | null;
}

export interface CreateEntradaRequest {
  idAlmacen:     number;
  idProveedor?:  number | null;
  numRemision?:  string;
  fchEntrada:    string;
  observaciones?: string;
  detalles:      CreateEntradaDetalleRequest[];
}

// ─── List Params ──────────────────────────────────────────────────────────────

export interface LotesListParams extends PaginationParams {
  idInsumo?: number;
  search?:   string;
}

export interface EntradasListParams extends PaginationParams {
  idAlmacen?: number;
  search?:    string;
}

export interface KardexListParams extends PaginationParams {
  idInsumo?:  number;
  idAlmacen?: number;
  idLote?:    number;
  search?:    string;
}

export interface ExistenciasListParams extends PaginationParams {
  idAlmacen?:       number;
  idInsumo?:        number;
  soloBajoCritico?: boolean;
  search?:          string;
}

// ─── List Responses ───────────────────────────────────────────────────────────

export type LotesListResponse       = ListResponse<LoteInsumo>;
export type EntradasListResponse    = ListResponse<EntradaInventario>;
export type KardexListResponse      = ListResponse<KardexMovimiento>;
export type ExistenciasListResponse = ListResponse<ExistenciaAlmacen>;

// ─── Phase 3: Salidas ────────────────────────────────────────────────────────

export const TIPO_SALIDA = {
  SALIDA:     "SALIDA",
  MERMA:      "MERMA",
  DEVOLUCION: "DEVOLUCION",
} as const;

export type TipoSalida = (typeof TIPO_SALIDA)[keyof typeof TIPO_SALIDA];

export const TIPO_SALIDA_LABELS: Record<TipoSalida, string> = {
  SALIDA:     "Salida directa",
  MERMA:      "Merma / Pérdida",
  DEVOLUCION: "Devolución a proveedor",
};

export interface SalidaDetalle {
  id:          number;
  idInsumo:    number;
  insumoNombre: string;
  idLote:      number | null;
  numLote:     string;
  cantidad:    string;
}

export interface SalidaInventario {
  id:           number;
  idAlmacen:    number;
  almacenNombre: string;
  tipoSalida:   TipoSalida;
  numFolio:     string;
  fchSalida:    string;
  motivo:       string;
  isActive:     boolean;
  createdAt:    string;
  detalles:     SalidaDetalle[];
}

export interface CreateSalidaDetalleRequest {
  idInsumo: number;
  idLote?:  number | null;
  cantidad: string;
}

export interface CreateSalidaRequest {
  idAlmacen:     number;
  tipoSalida:    TipoSalida;
  numFolio?:     string;
  fchSalida:     string;
  motivo?:       string;
  detalles:      CreateSalidaDetalleRequest[];
}

export interface SalidasListParams extends PaginationParams {
  idAlmacen?:  number;
  tipoSalida?: TipoSalida;
  search?:     string;
}

export type SalidasListResponse = ListResponse<SalidaInventario>;

// ─── Phase 4: Conteo Físico ──────────────────────────────────────────────────

export interface ConteoFisicoDetalle {
  id:          number;
  idInsumo:    number;
  insumoNombre: string;
  idLote:      number | null;
  numLote:     string;
  cantSistema: string;
  cantFisica:  string;
  diferencia:  string;
}

export interface ConteoFisico {
  id:           number;
  idAlmacen:    number;
  almacenNombre: string;
  fchConteo:    string;
  observaciones: string;
  cerrado:      boolean;
  fchCierre:    string | null;
  isActive:     boolean;
  createdAt:    string;
  detalles:     ConteoFisicoDetalle[];
}

export interface CreateConteoRequest {
  idAlmacen:     number;
  fchConteo:     string;
  observaciones?: string;
}

export interface CerrarConteoRequest {
  detalles: { id: number; cantFisica: string }[];
}

export interface ConteosListParams extends PaginationParams {
  idAlmacen?: number;
  search?:    string;
}

export type ConteosListResponse = ListResponse<ConteoFisico>;

// ─── Phase 5: Dashboard ──────────────────────────────────────────────────────

export interface DashboardStats {
  totalInsumos:         number;
  bajoStock:            number;
  entradasMes:          number;
  salidasMes:           number;
  consumosMes:          number;
  movimientosRecientes: KardexMovimiento[];
}

// ─── Phase 6: Consumos por Consulta ─────────────────────────────────────────

export interface ConsumoConsultaDetalle {
  id:          number;
  idInsumo:    number;
  insumoNombre: string;
  idLote:      number | null;
  numLote:     string;
  cantidad:    string;
}

export interface ConsumoConsulta {
  id:           number;
  idAlmacen:    number;
  almacenNombre: string;
  idCita:       number | null;
  paciente:     string;
  medico:       string;
  fchConsumo:   string;
  observaciones: string;
  isActive:     boolean;
  createdAt:    string;
  detalles:     ConsumoConsultaDetalle[];
}

export interface CreateConsumoDetalleRequest {
  idInsumo: number;
  idLote?:  number | null;
  cantidad: string;
}

export interface CreateConsumoRequest {
  idAlmacen:     number;
  idCita?:       number | null;
  paciente?:     string;
  medico?:       string;
  fchConsumo:    string;
  observaciones?: string;
  detalles:      CreateConsumoDetalleRequest[];
}

export interface ConsumosListParams extends PaginationParams {
  idAlmacen?: number;
  idCita?:    number;
  search?:    string;
}

export type ConsumosListResponse = ListResponse<ConsumoConsulta>;
