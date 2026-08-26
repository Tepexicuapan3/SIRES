import type { OcupacionDetail, CreateOcupacionRequest, UpdateOcupacionRequest } from "@api/types";
import type {
  OcupacionDetailsFormValues,
  CreateOcupacionFormValues,
} from "@features/admin/modules/catalogos/ocupaciones/domain/ocupaciones.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapOcupacionDetailToFormValues = (
  detail?: OcupacionDetail | null,
): OcupacionDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateOcupacionPayload = (
  values: CreateOcupacionFormValues,
): CreateOcupacionRequest => ({
  name: values.name.trim(),
});

export const buildUpdateOcupacionPayload = (
  values: OcupacionDetailsFormValues,
  dirtyFields: Partial<Record<keyof OcupacionDetailsFormValues, boolean>>,
): UpdateOcupacionRequest => {
  const payload: UpdateOcupacionRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
