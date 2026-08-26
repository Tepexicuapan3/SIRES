import type { ParentescoDetail, CreateParentescoRequest, UpdateParentescoRequest } from "@api/types";
import type {
  ParentescoDetailsFormValues,
  CreateParentescoFormValues,
} from "@features/admin/modules/catalogos/parentescos/domain/parentesco.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapParentescoDetailToFormValues = (
  detail?: ParentescoDetail | null,
): ParentescoDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateParentescoPayload = (
  values: CreateParentescoFormValues,
): CreateParentescoRequest => ({
  id: values.id.trim(),
  name: values.name.trim(),
});

export const buildUpdateParentescoPayload = (
  values: ParentescoDetailsFormValues,
  dirtyFields: Partial<Record<keyof ParentescoDetailsFormValues, boolean>>,
): UpdateParentescoRequest => {
  const payload: UpdateParentescoRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
