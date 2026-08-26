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
});

export const buildCreateEstudioMedicoPayload = (
  values: CreateEstudioMedicoFormValues,
): CreateEstudioMedicoRequest => ({
  name: values.name.trim(),
  studyType: values.studyType.trim(),
  indication: values.indication.trim(),
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

  return payload;
};
