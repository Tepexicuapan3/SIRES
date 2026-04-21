import type { EscolaridadDetail, CreateEscolaridadRequest, UpdateEscolaridadRequest } from "@api/types";
import type {
  EscolaridadDetailsFormValues,
  CreateEscolaridadFormValues,
} from "@features/admin/modules/catalogos/escolaridad/domain/escolaridad.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapEscolaridadDetailToFormValues = (
  detail?: EscolaridadDetail | null,
): EscolaridadDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateEscolaridadPayload = (
  values: CreateEscolaridadFormValues,
): CreateEscolaridadRequest => ({
  name: values.name.trim(),
});

export const buildUpdateEscolaridadPayload = (
  values: EscolaridadDetailsFormValues,
  dirtyFields: Partial<Record<keyof EscolaridadDetailsFormValues, boolean>>,
): UpdateEscolaridadRequest => {
  const payload: UpdateEscolaridadRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
