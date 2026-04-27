import type {
  AreaClinicaDetail,
  CreateAreaClinicaRequest,
  UpdateAreaClinicaRequest,
} from "@api/types";
import type {
  AreaClinicaDetailsFormValues,
  CreateAreaClinicaFormValues,
} from "@features/admin/modules/catalogos/areas-clinicas/domain/areas-clinicas.schemas";

export const mapAreaClinicaDetailToFormValues = (
  detail?: AreaClinicaDetail | null,
): AreaClinicaDetailsFormValues => ({
  name: detail?.name ?? "",
});

export const buildCreateAreaClinicaPayload = (
  values: CreateAreaClinicaFormValues,
): CreateAreaClinicaRequest => ({
  name: values.name.trim(),
});

export const buildUpdateAreaClinicaPayload = (
  values: AreaClinicaDetailsFormValues,
  dirtyFields: Partial<Record<keyof AreaClinicaDetailsFormValues, boolean>>,
): UpdateAreaClinicaRequest => {
  const payload: UpdateAreaClinicaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
