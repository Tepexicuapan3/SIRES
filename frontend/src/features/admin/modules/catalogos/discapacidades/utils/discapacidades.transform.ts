import type { DiscapacidadDetail, CreateDiscapacidadRequest, UpdateDiscapacidadRequest } from "@api/types";
import type {
  DiscapacidadDetailsFormValues,
  CreateDiscapacidadFormValues,
} from "@features/admin/modules/catalogos/discapacidades/domain/discapacidades.schemas";

export const mapDiscapacidadDetailToFormValues = (
  detail?: DiscapacidadDetail | null,
): DiscapacidadDetailsFormValues => ({
  name: detail?.name ?? "",
  code: detail?.code ?? "",
});

export const buildCreateDiscapacidadPayload = (
  values: CreateDiscapacidadFormValues,
): CreateDiscapacidadRequest => ({
  name: values.name.trim(),
  code: values.code.trim(),
});

export const buildUpdateDiscapacidadPayload = (
  values: DiscapacidadDetailsFormValues,
  dirtyFields: Partial<Record<keyof DiscapacidadDetailsFormValues, boolean>>,
): UpdateDiscapacidadRequest => {
  const payload: UpdateDiscapacidadRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }
  if (dirtyFields.code && values.code !== undefined) {
    payload.code = values.code.trim();
  }

  return payload;
};
