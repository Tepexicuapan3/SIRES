import type { EscuelaDetail, CreateEscuelaRequest, UpdateEscuelaRequest } from "@api/types";
import type {
  EscuelaDetailsFormValues,
  CreateEscuelaFormValues,
} from "@features/admin/modules/catalogos/escuelas/domain/escuelas.schemas";

export const mapEscuelaDetailToFormValues = (
  detail?: EscuelaDetail | null,
): EscuelaDetailsFormValues => ({
  name: detail?.name ?? "",
  code: detail?.code ?? "",
});

export const buildCreateEscuelaPayload = (
  values: CreateEscuelaFormValues,
): CreateEscuelaRequest => ({
  name: values.name.trim(),
  code: values.code.trim(),
});

export const buildUpdateEscuelaPayload = (
  values: EscuelaDetailsFormValues,
  dirtyFields: Partial<Record<keyof EscuelaDetailsFormValues, boolean>>,
): UpdateEscuelaRequest => {
  const payload: UpdateEscuelaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }
  if (dirtyFields.code && values.code !== undefined) {
    payload.code = values.code.trim();
  }

  return payload;
};
