import type {
  EstudioMedicoDetail,
  CreateEstudioMedicoRequest,
  UpdateEstudioMedicoRequest,
} from "@api/types";
import type {
  EstudioMedicoDetailsFormValues,
  CreateEstudioMedicoFormValues,
} from "@features/admin/modules/catalogos/estudios-medicos/domain/estudios-medicos.schemas";

export const mapEstudioMedicoDetailToFormValues = (
  detail?: EstudioMedicoDetail | null,
): EstudioMedicoDetailsFormValues => ({
  name: detail?.name ?? "",
  studyType: detail?.studyType ?? "",
  indication: detail?.indication ?? "",
  precio: detail?.precio != null ? Number(detail.precio) : undefined,
  isGeneral: detail?.isGeneral ?? false,
  isAuthorized: detail?.isAuthorized ?? false,
  groupType: detail?.groupType ?? undefined,
  providerId: detail?.providerId ?? undefined,
});

export const buildCreateEstudioMedicoPayload = (
  values: CreateEstudioMedicoFormValues,
): CreateEstudioMedicoRequest => ({
  name: values.name.trim(),
  studyType: values.studyType.trim(),
  indication: values.indication.trim(),
  precio: values.precio != null ? String(values.precio) : null,
  isGeneral: values.isGeneral,
  isAuthorized: values.isAuthorized,
  groupType: values.groupType ?? null,
  providerId: values.providerId ?? null,
});

export const buildUpdateEstudioMedicoPayload = (
  values: EstudioMedicoDetailsFormValues,
  dirtyFields: Partial<Record<keyof EstudioMedicoDetailsFormValues, boolean>>,
): UpdateEstudioMedicoRequest => {
  const payload: UpdateEstudioMedicoRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }
  if (dirtyFields.studyType && values.studyType !== undefined) {
    payload.studyType = values.studyType.trim();
  }
  if (dirtyFields.indication && values.indication !== undefined) {
    payload.indication = values.indication.trim();
  }
  if (dirtyFields.precio) {
    payload.precio = values.precio != null ? String(values.precio) : null;
  }
  if (dirtyFields.isGeneral) {
    payload.isGeneral = values.isGeneral;
  }
  if (dirtyFields.isAuthorized) {
    payload.isAuthorized = values.isAuthorized;
  }
  if (dirtyFields.groupType) {
    payload.groupType = values.groupType ?? null;
  }
  if (dirtyFields.providerId) {
    payload.providerId = values.providerId ?? null;
  }

  return payload;
};
