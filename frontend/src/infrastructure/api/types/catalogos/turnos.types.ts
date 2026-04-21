/**
 * Turnos Types - Pure TypeScript interfaces
 *
 * Contrato alineado al backend actual:
 * - GET    /shifts/
 * - POST   /shifts/
 * - GET    /shifts/:id
 * - PUT    /shifts/:id
 * - DELETE /shifts/:id
 */

import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

/**
 * Item para tabla/listado.
 * Alineado a TurnosListSerializer.
 */
export interface TurnoListItem {
  id: number;
  name: string;
  isActive: boolean;
}

/**
 * Detalle completo.
 * Alineado a TurnosDetailSerializer.
 */
export interface TurnoDetail extends TurnoListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateTurnoRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateTurnoRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type TurnosListResponse = ListResponse<TurnoListItem>;

export interface TurnoDetailResponse {
  shift: TurnoDetail;
}

export interface CreateTurnoResponse {
  id: number;
  name: string;
}

export interface UpdateTurnoResponse {
  shift: TurnoDetail;
}

export type DeleteTurnoResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface TurnosListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
