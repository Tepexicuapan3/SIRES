import type { PaginationParams, ListResponse } from "@api/types/common.types";

export type CuadroBasico = "BASICO" | "ESPECIAL" | "INSTITUCIONAL";

export interface MedicamentoListItem {
  id: number;
  name: string;
  genericName: string | null;
  presentation: string | null;
  cuadroBasico: CuadroBasico;
  isControlled: boolean;
  maxQuantity: number | null;
  isActive: boolean;
}

export type MedicamentosListResponse = ListResponse<MedicamentoListItem>;

export interface MedicamentosListParams extends PaginationParams {
  isActive?: boolean;
  cuadroBasico?: CuadroBasico;
}
