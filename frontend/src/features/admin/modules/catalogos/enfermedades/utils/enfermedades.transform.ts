import type { EnfermedadDetail, CreateEnfermedadRequest, UpdateEnfermedadRequest } from "@api/types";
import type {
  EnfermedadDetailsFormValues,
  CreateEnfermedadFormValues,
} from "@features/admin/modules/catalogos/enfermedades/domain/enfermedades.schemas";

export const mapEnfermedadDetailToFormValues = (
  detail?: EnfermedadDetail | null,
): EnfermedadDetailsFormValues => ({
  name: detail?.name ?? "",
  code: detail?.code ?? "",
  cieVersion: detail?.cieVersion ?? "",
});

export const buildCreateEnfermedadPayload = (
  values: CreateEnfermedadFormValues,
): CreateEnfermedadRequest => ({
  name: values.name.trim(),
  code: values.code.trim(),
  cieVersion: values.cieVersion.trim(),
});

export const buildUpdateEnfermedadPayload = (
  values: EnfermedadDetailsFormValues,
  dirtyFields: Partial<Record<keyof EnfermedadDetailsFormValues, boolean>>,
): UpdateEnfermedadRequest => {
  const payload: UpdateEnfermedadRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }
  if (dirtyFields.code && values.code !== undefined) {
    payload.code = values.code.trim();
  }
  if (dirtyFields.cieVersion && values.cieVersion !== undefined) {
    payload.cieVersion = values.cieVersion.trim();
  }

  return payload;
};
