import type { OrigenConsultaDetail, CreateOrigenConsultaRequest, UpdateOrigenConsultaRequest } from "@api/types";
import type {
  OrigenConsultaDetailsFormValues,
  CreateOrigenConsultaFormValues,
} from "@features/admin/modules/catalogos/origen-consulta/domain/origenConsulta.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapOrigenConsultaDetailToFormValues = (
  detail?: OrigenConsultaDetail | null,
): OrigenConsultaDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateOrigenConsultaPayload = (
  values: CreateOrigenConsultaFormValues,
): CreateOrigenConsultaRequest => ({
  id: values.id.trim(),
  name: values.name.trim(),
});

export const buildUpdateOrigenConsultaPayload = (
  values: OrigenConsultaDetailsFormValues,
  dirtyFields: Partial<Record<keyof OrigenConsultaDetailsFormValues, boolean>>,
): UpdateOrigenConsultaRequest => {
  const payload: UpdateOrigenConsultaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
