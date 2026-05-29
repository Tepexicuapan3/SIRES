import type { TipoPersonalDetail, CreateTipoPersonalRequest, UpdateTipoPersonalRequest } from "@api/types";
import type {
  TipoPersonalDetailsFormValues,
  CreateTipoPersonalFormValues,
} from "@features/admin/modules/catalogos/tipo-personal/domain/tipo-personal.schemas";

export const mapTipoPersonalDetailToFormValues = (
  detail?: TipoPersonalDetail | null,
): TipoPersonalDetailsFormValues => ({
  name: detail?.name ?? "",
});

export const buildCreateTipoPersonalPayload = (
  values: CreateTipoPersonalFormValues,
): CreateTipoPersonalRequest => ({
  name: values.name.trim(),
});

export const buildUpdateTipoPersonalPayload = (
  values: TipoPersonalDetailsFormValues,
  dirtyFields: Partial<Record<keyof TipoPersonalDetailsFormValues, boolean>>,
): UpdateTipoPersonalRequest => {
  const payload: UpdateTipoPersonalRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
