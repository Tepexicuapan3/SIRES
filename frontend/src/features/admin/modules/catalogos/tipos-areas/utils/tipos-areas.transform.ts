import type { TipoAreaDetail, CreateTipoAreaRequest, UpdateTipoAreaRequest } from "@api/types";
import type {
  TipoAreaDetailsFormValues,
  CreateTipoAreaFormValues,
} from "@features/admin/modules/catalogos/tipos-areas/domain/tipos-areas.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapTipoAreaDetailToFormValues = (
  detail?: TipoAreaDetail | null,
): TipoAreaDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateTipoAreaPayload = (
  values: CreateTipoAreaFormValues,
): CreateTipoAreaRequest => ({
  name: values.name.trim(),
});

export const buildUpdateTipoAreaPayload = (
  values: TipoAreaDetailsFormValues,
  dirtyFields: Partial<Record<keyof TipoAreaDetailsFormValues, boolean>>,
): UpdateTipoAreaRequest => {
  const payload: UpdateTipoAreaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
