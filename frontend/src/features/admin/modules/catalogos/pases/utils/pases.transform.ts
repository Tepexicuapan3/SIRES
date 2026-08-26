import type { PaseDetail, CreatePaseRequest, UpdatePaseRequest } from "@api/types";
import type {
  PaseDetailsFormValues,
  CreatePaseFormValues,
} from "@features/admin/modules/catalogos/pases/domain/pases.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapPaseDetailToFormValues = (
  detail?: PaseDetail | null,
): PaseDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreatePasePayload = (
  values: CreatePaseFormValues,
): CreatePaseRequest => ({
  name: values.name.trim(),
});

export const buildUpdatePasePayload = (
  values: PaseDetailsFormValues,
  dirtyFields: Partial<Record<keyof PaseDetailsFormValues, boolean>>,
): UpdatePaseRequest => {
  const payload: UpdatePaseRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
