import type { TipoResidenciaDetail, CreateTipoResidenciaRequest, UpdateTipoResidenciaRequest } from "@api/types";
import type {
  TipoResidenciaDetailsFormValues,
  CreateTipoResidenciaFormValues,
} from "@features/admin/modules/catalogos/tipos-residencia/domain/tipos-residencia.schemas";

export const mapTipoResidenciaDetailToFormValues = (
  detail?: TipoResidenciaDetail | null,
): TipoResidenciaDetailsFormValues => ({
  name: detail?.name ?? "",
});

export const buildCreateTipoResidenciaPayload = (
  values: CreateTipoResidenciaFormValues,
): CreateTipoResidenciaRequest => ({
  name: values.name.trim(),
});

export const buildUpdateTipoResidenciaPayload = (
  values: TipoResidenciaDetailsFormValues,
  dirtyFields: Partial<Record<keyof TipoResidenciaDetailsFormValues, boolean>>,
): UpdateTipoResidenciaRequest => {
  const payload: UpdateTipoResidenciaRequest = {};
  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }
  return payload;
};
