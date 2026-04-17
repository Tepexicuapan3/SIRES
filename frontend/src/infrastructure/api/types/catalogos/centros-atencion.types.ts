/**
 * Centros de Atencion Types - Pure TypeScript interfaces
 *
 * Contrato alineado al backend actual:
 * - GET    /care-centers/
 * - POST   /care-centers/
 * - GET    /care-centers/:id
 * - PUT    /care-centers/:id
 * - DELETE /care-centers/:id
 *
 * Recursos relacionados:
 * - GET    /care-center-schedules/
 * - POST   /care-center-schedules/
 * - GET    /care-center-schedules/:id
 * - PUT    /care-center-schedules/:id
 * - DELETE /care-center-schedules/:id
 *
 * Búsqueda CP:
 * - GET    /postal-codes/search/?cp=01000
 */

import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// CATALOG REFS
// =============================================================================

export interface CatalogRef {
  id: number;
  name: string;
}

export interface CentroAtencionRef extends CatalogRef {}
export interface TurnoRef extends CatalogRef {}

// =============================================================================
// ENUMS / LITERALS
// =============================================================================

export type CentroAtencionType = "CLINICA" | "HOSPITAL";
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// =============================================================================
// ENTIDADES - CENTROS DE ATENCION
// =============================================================================

/**
 * Item para tabla/listado.
 * Alineado a CatCentroAtencionListSerializer.
 */
export interface CentroAtencionListItem {
  id: number;
  name: string;
  code: string;
  centerType: CentroAtencionType;
  legacyFolio: string | null;
  isExternal: boolean;
  isActive: boolean;
}

/**
 * Detalle completo.
 * Alineado a CatCentroAtencionDetailSerializer.
 */
export interface CentroAtencionDetail extends CentroAtencionListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;

  address: string | null;
  postalCode: string | null;
  neighborhood: string | null;
  municipality: string | null;
  state: string | null;
  city: string | null;
  phone: string | null;
}

// =============================================================================
// ENTIDADES - HORARIOS DE CENTRO
// =============================================================================

/**
 * Item de listado de horarios.
 * Alineado a CatCentroAtencionHorarioListSerializer.
 */
export interface CentroAtencionHorarioListItem {
  id: number;
  center: CentroAtencionRef | null;
  shift: TurnoRef | null;
  weekDay: DiaSemana;
  isOpen: boolean;
  is24Hours: boolean;
  openingTime: string | null; // HH:mm:ss
  closingTime: string | null; // HH:mm:ss
  isActive: boolean;
}

/**
 * Detalle completo de horario.
 * Alineado a CatCentroAtencionHorarioDetailSerializer.
 */
export interface CentroAtencionHorarioDetail {
  id: number;
  center: CentroAtencionRef | null;
  shift: TurnoRef | null;
  weekDay: DiaSemana;
  isOpen: boolean;
  is24Hours: boolean;
  openingTime: string | null;
  closingTime: string | null;
  observations: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// ENTIDADES - CODIGOS POSTALES
// =============================================================================

export interface PostalCodeSearchItem {
  codigoPostal: string;
  colonia: string;
  tipoAsentamiento: string;
  municipio: string;
  estado: string;
  ciudad: string;
  zona: string;
}

// =============================================================================
// REQUESTS - CENTROS DE ATENCION
// =============================================================================

export interface CreateCentroAtencionRequest {
  name: string;
  code: string;
  centerType: CentroAtencionType;
  legacyFolio?: string | null;
  isExternal?: boolean;
  address?: string | null;
  postalCode?: string | null;
  neighborhood?: string | null;
  municipality?: string | null;
  state?: string | null;
  city?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface UpdateCentroAtencionRequest {
  name?: string;
  code?: string;
  centerType?: CentroAtencionType;
  legacyFolio?: string | null;
  isExternal?: boolean;
  address?: string | null;
  postalCode?: string | null;
  neighborhood?: string | null;
  municipality?: string | null;
  state?: string | null;
  city?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

// =============================================================================
// REQUESTS - HORARIOS
// =============================================================================

export interface CreateCentroAtencionHorarioRequest {
  centerId: number;
  shiftId: number;
  weekDay: DiaSemana;
  isOpen: boolean;
  is24Hours?: boolean;
  openingTime?: string | null; // HH:mm:ss
  closingTime?: string | null; // HH:mm:ss
  observations?: string | null;
  isActive?: boolean;
}

export interface UpdateCentroAtencionHorarioRequest {
  centerId?: number;
  shiftId?: number;
  weekDay?: DiaSemana;
  isOpen?: boolean;
  is24Hours?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
  observations?: string | null;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES - CENTROS DE ATENCION
// =============================================================================

export type CentrosAtencionListResponse = ListResponse<CentroAtencionListItem>;

export interface CentroAtencionDetailResponse {
  careCenter: CentroAtencionDetail;
}

export interface CreateCentroAtencionResponse {
  id: number;
  name: string;
}

export interface UpdateCentroAtencionResponse {
  careCenter: CentroAtencionDetail;
}

export type DeleteCentroAtencionResponse = SuccessResponse;

// =============================================================================
// RESPONSES - HORARIOS
// =============================================================================

export type CentrosAtencionHorariosListResponse =
  ListResponse<CentroAtencionHorarioListItem>;

export interface CentroAtencionHorarioDetailResponse {
  careCenterSchedule: CentroAtencionHorarioDetail;
}

export interface CreateCentroAtencionHorarioResponse {
  id: number;
  name: string;
}

export interface UpdateCentroAtencionHorarioResponse {
  careCenterSchedule: CentroAtencionHorarioDetail;
}

export type DeleteCentroAtencionHorarioResponse = SuccessResponse;

// =============================================================================
// RESPONSES - CODIGOS POSTALES
// =============================================================================

export interface PostalCodeSearchResponse {
  items: PostalCodeSearchItem[];
}

// =============================================================================
// PARAMS - LISTADOS
// =============================================================================

export interface CentrosAtencionListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  centerType?: CentroAtencionType;
  isExternal?: boolean;
  postalCode?: string;
  sortBy?: "name" | "isActive" | "code" | "centerType" | "legacyFolio";
  sortOrder?: "asc" | "desc";
}

export interface CentrosAtencionHorariosListParams extends PaginationParams {
  centerId?: number;
  shiftId?: number;
  weekDay?: DiaSemana;
  isOpen?: boolean;
  is24Hours?: boolean;
  isActive?: boolean;
  sortBy?: "name" | "isActive" | "weekDay";
  sortOrder?: "asc" | "desc";
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Modelo útil para formularios de centro.
 * Mantiene el shape desacoplado de la API si luego agregas transforms.
 */
export interface CentroAtencionFormValues {
  name: string;
  code: string;
  centerType: CentroAtencionType;
  legacyFolio: string | null;
  isExternal: boolean;
  address: string | null;
  postalCode: string | null;
  neighborhood: string | null;
  municipality: string | null;
  state: string | null;
  city: string | null;
  phone: string | null;
  isActive: boolean;
}

/**
 * Modelo útil para formularios de horario.
 */
export interface CentroAtencionHorarioFormValues {
  centerId: number;
  shiftId: number;
  weekDay: DiaSemana;
  isOpen: boolean;
  is24Hours: boolean;
  openingTime: string | null;
  closingTime: string | null;
  observations: string | null;
  isActive: boolean;
}