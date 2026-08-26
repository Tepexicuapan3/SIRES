import type { CalidadLaboralDetail, CreateCalidadLaboralRequest, UpdateCalidadLaboralRequest } from "@api/types";
import type {
  CalidadLaboralDetailsFormValues,
  CreateCalidadLaboralFormValues,
} from "@features/admin/modules/catalogos/calidad-laboral/domain/calidadLaboral.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapCalidadLaboralDetailToFormValues = (
  detail?: CalidadLaboralDetail | null,
): CalidadLaboralDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateCalidadLaboralPayload = (
  values: CreateCalidadLaboralFormValues,
): CreateCalidadLaboralRequest => ({
  id: values.id.trim(),
  name: values.name.trim(),
});

export const buildUpdateCalidadLaboralPayload = (
  values: CalidadLaboralDetailsFormValues,
  dirtyFields: Partial<Record<keyof CalidadLaboralDetailsFormValues, boolean>>,
): UpdateCalidadLaboralRequest => {
  const payload: UpdateCalidadLaboralRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
