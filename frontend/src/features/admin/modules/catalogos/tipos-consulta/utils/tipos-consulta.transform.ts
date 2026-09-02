import type { TipoConsultaDetail, CreateTipoConsultaRequest, UpdateTipoConsultaRequest } from "@api/types";
import type {
  TipoConsultaDetailsFormValues,
  CreateTipoConsultaFormValues,
} from "@features/admin/modules/catalogos/tipos-consulta/domain/tipos-consulta.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapTipoConsultaDetailToFormValues = (
  detail?: TipoConsultaDetail | null,
): TipoConsultaDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateTipoConsultaPayload = (
  values: CreateTipoConsultaFormValues,
): CreateTipoConsultaRequest => ({
  name: values.name.trim(),
});

export const buildUpdateTipoConsultaPayload = (
  values: TipoConsultaDetailsFormValues,
  dirtyFields: Partial<Record<keyof TipoConsultaDetailsFormValues, boolean>>,
): UpdateTipoConsultaRequest => {
  const payload: UpdateTipoConsultaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
