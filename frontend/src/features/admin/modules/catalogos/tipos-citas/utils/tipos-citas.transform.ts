import type { TipoCitaDetail, CreateTipoCitaRequest, UpdateTipoCitaRequest } from "@api/types";
import type {
  TipoCitaDetailsFormValues,
  CreateTipoCitaFormValues,
} from "@features/admin/modules/catalogos/tipos-citas/domain/tipos-citas.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapTipoCitaDetailToFormValues = (
  detail?: TipoCitaDetail | null,
): TipoCitaDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateTipoCitaPayload = (
  values: CreateTipoCitaFormValues,
): CreateTipoCitaRequest => ({
  name: values.name.trim(),
});

export const buildUpdateTipoCitaPayload = (
  values: TipoCitaDetailsFormValues,
  dirtyFields: Partial<Record<keyof TipoCitaDetailsFormValues, boolean>>,
): UpdateTipoCitaRequest => {
  const payload: UpdateTipoCitaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
