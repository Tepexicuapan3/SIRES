import type { TipoSanguineoDetail, CreateTipoSanguineoRequest, UpdateTipoSanguineoRequest } from "@api/types";
import type {
  TipoSanguineoDetailsFormValues,
  CreateTipoSanguineoFormValues,
} from "@features/admin/modules/catalogos/tipos-sanguineo/domain/tipos-sanguineo.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapTipoSanguineoDetailToFormValues = (
  detail?: TipoSanguineoDetail | null,
): TipoSanguineoDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateTipoSanguineoPayload = (
  values: CreateTipoSanguineoFormValues,
): CreateTipoSanguineoRequest => ({
  name: values.name.trim(),
});

export const buildUpdateTipoSanguineoPayload = (
  values: TipoSanguineoDetailsFormValues,
  dirtyFields: Partial<Record<keyof TipoSanguineoDetailsFormValues, boolean>>,
): UpdateTipoSanguineoRequest => {
  const payload: UpdateTipoSanguineoRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
