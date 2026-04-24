import type { InventarioVacunaDetail } from "@api/types";
import type { UpdateInventarioFormValues } from "../domain/inventario-vacunas.schemas";

export function toUpdateRequest(
  values: UpdateInventarioFormValues,
): { stockQuantity?: number; isActive?: boolean } {
  const patch: { stockQuantity?: number; isActive?: boolean } = {};
  if (values.stockQuantity !== undefined) patch.stockQuantity = values.stockQuantity;
  if (values.isActive !== undefined) patch.isActive = values.isActive;
  return patch;
}

export function getDefaultUpdateValues(
  detail: InventarioVacunaDetail,
): UpdateInventarioFormValues {
  return {
    stockQuantity: detail.stockQuantity,
    isActive: detail.isActive,
  };
}
