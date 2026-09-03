import type { ReligionDetail, CreateReligionRequest, UpdateReligionRequest } from "@api/types";
import type {
  ReligionDetailsFormValues,
  CreateReligionFormValues,
} from "@features/admin/modules/catalogos/religiones/domain/religiones.schemas";

export const mapReligionDetailToFormValues = (
  detail?: ReligionDetail | null,
): ReligionDetailsFormValues => ({
  name: detail?.name ?? "",
});

export const buildCreateReligionPayload = (
  values: CreateReligionFormValues,
): CreateReligionRequest => ({
  name: values.name.trim(),
});

export const buildUpdateReligionPayload = (
  values: ReligionDetailsFormValues,
  dirtyFields: Partial<Record<keyof ReligionDetailsFormValues, boolean>>,
): UpdateReligionRequest => {
  const payload: UpdateReligionRequest = {};
  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }
  return payload;
};
