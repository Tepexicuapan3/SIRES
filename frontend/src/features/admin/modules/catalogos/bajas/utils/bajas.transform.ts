import type { BajaDetail, CreateBajaRequest, UpdateBajaRequest } from "@api/types";
import type {
  BajaDetailsFormValues,
  CreateBajaFormValues,
} from "@features/admin/modules/catalogos/bajas/domain/bajas.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapBajaDetailToFormValues = (
  detail?: BajaDetail | null,
): BajaDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateBajaPayload = (
  values: CreateBajaFormValues,
): CreateBajaRequest => ({
  name: values.name.trim(),
});

export const buildUpdateBajaPayload = (
  values: BajaDetailsFormValues,
  dirtyFields: Partial<Record<keyof BajaDetailsFormValues, boolean>>,
): UpdateBajaRequest => {
  const payload: UpdateBajaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
