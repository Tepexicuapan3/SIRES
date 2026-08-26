import type {
  EstudioDetail,
  CreateEstudioRequest,
  UpdateEstudioRequest,
} from "@api/types";
import type {
  EstudioDetailsFormValues,
  CreateEstudioFormValues,
} from "@features/admin/modules/catalogos/estudios/domain/estudios.schemas";

export const mapEstudioDetailToFormValues = (
  detail?: EstudioDetail | null,
): EstudioDetailsFormValues => ({
  name: detail?.name ?? "",
  studyType: detail?.studyType ?? "",
  precio: detail?.precio ?? undefined,
  indication: detail?.indication ?? "",
});

export const buildCreateEstudioPayload = (
  values: CreateEstudioFormValues,
): CreateEstudioRequest => ({
  name: values.name.trim(),
  studyType: values.studyType.trim(),
  precio: values.precio,
  indication: values.indication?.trim() || null,
});

export const buildUpdateEstudioPayload = (
  values: EstudioDetailsFormValues,
  dirtyFields: Partial<Record<keyof EstudioDetailsFormValues, boolean>>,
): UpdateEstudioRequest => {
  const payload: UpdateEstudioRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }
  if (dirtyFields.studyType && values.studyType !== undefined) {
    payload.studyType = values.studyType.trim();
  }
  if (dirtyFields.precio) {
    payload.precio = values.precio ?? null;
  }
  if (dirtyFields.indication) {
    payload.indication = values.indication?.trim() || null;
  }

  return payload;
};
