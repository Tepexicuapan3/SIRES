import type { TurnoDetail, CreateTurnoRequest, UpdateTurnoRequest } from "@api/types";
import type {
  TurnoDetailsFormValues,
  CreateTurnoFormValues,
} from "@features/admin/modules/catalogos/turnos/domain/turnos.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapTurnoDetailToFormValues = (
  detail?: TurnoDetail | null,
): TurnoDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateTurnoPayload = (
  values: CreateTurnoFormValues,
): CreateTurnoRequest => ({
  name: values.name.trim(),
});

export const buildUpdateTurnoPayload = (
  values: TurnoDetailsFormValues,
  dirtyFields: Partial<Record<keyof TurnoDetailsFormValues, boolean>>,
): UpdateTurnoRequest => {
  const payload: UpdateTurnoRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
