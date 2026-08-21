import type { EdoCivilDetail, CreateEdoCivilRequest, UpdateEdoCivilRequest } from "@api/types";
import type {
  EdoCivilDetailsFormValues,
  CreateEdoCivilFormValues,
} from "@features/admin/modules/catalogos/edo-civil/domain/edoCivil.schemas";

export const mapEdoCivilDetailToFormValues = (
  detail?: EdoCivilDetail | null,
): EdoCivilDetailsFormValues => ({
  name: detail?.name ?? "",
});

export const buildCreateEdoCivilPayload = (
  values: CreateEdoCivilFormValues,
): CreateEdoCivilRequest => ({
  name: values.name.trim(),
});

export const buildUpdateEdoCivilPayload = (
  values: EdoCivilDetailsFormValues,
  dirtyFields: Partial<Record<keyof EdoCivilDetailsFormValues, boolean>>,
): UpdateEdoCivilRequest => {
  const payload: UpdateEdoCivilRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
