import type {
  EspecialidadDetail,
  CreateEspecialidadRequest,
  UpdateEspecialidadRequest,
} from "@api/types";
import type {
  EspecialidadDetailsFormValues,
  CreateEspecialidadFormValues,
} from "@features/admin/modules/catalogos/especialidades/domain/especialidades.schemas";

export const mapEspecialidadDetailToFormValues = (
  detail?: EspecialidadDetail | null,
): EspecialidadDetailsFormValues => ({
  name: detail?.name ?? "",
});

export const buildCreateEspecialidadPayload = (
  values: CreateEspecialidadFormValues,
): CreateEspecialidadRequest => ({
  name: values.name.trim(),
});

export const buildUpdateEspecialidadPayload = (
  values: EspecialidadDetailsFormValues,
  dirtyFields: Partial<Record<keyof EspecialidadDetailsFormValues, boolean>>,
): UpdateEspecialidadRequest => {
  const payload: UpdateEspecialidadRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
