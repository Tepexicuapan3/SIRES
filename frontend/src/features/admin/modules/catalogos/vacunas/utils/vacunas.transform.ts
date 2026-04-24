import type { VacunaDetail, CreateVacunaRequest, UpdateVacunaRequest } from "@api/types";
import type {
  VacunaDetailsFormValues,
  CreateVacunaFormValues,
} from "@features/admin/modules/catalogos/vacunas/domain/vacunas.schemas";

export const mapVacunaDetailToFormValues = (
  detail?: VacunaDetail | null,
): VacunaDetailsFormValues => ({
  name: detail?.name ?? "",
});

export const buildCreateVacunaPayload = (
  values: CreateVacunaFormValues,
): CreateVacunaRequest => ({
  name: values.name.trim(),
});

export const buildUpdateVacunaPayload = (
  values: VacunaDetailsFormValues,
  dirtyFields: Partial<Record<keyof VacunaDetailsFormValues, boolean>>,
): UpdateVacunaRequest => {
  const payload: UpdateVacunaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
