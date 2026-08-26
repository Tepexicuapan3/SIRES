import type { TipoAutorizacionDetail, CreateTipoAutorizacionRequest, UpdateTipoAutorizacionRequest } from "@api/types";
import type {
  TipoAutorizacionDetailsFormValues,
  CreateTipoAutorizacionFormValues,
} from "@features/admin/modules/catalogos/tipos-autorizacion/domain/tipos-autorizacion.schemas";

export const mapTipoAutorizacionDetailToFormValues = (
  detail?: TipoAutorizacionDetail | null,
): TipoAutorizacionDetailsFormValues => ({
  name: detail?.name ?? "",
  code: detail?.code ?? "",
});

export const buildCreateTipoAutorizacionPayload = (
  values: CreateTipoAutorizacionFormValues,
): CreateTipoAutorizacionRequest => ({
  name: values.name.trim(),
  code: values.code.trim(),
});

export const buildUpdateTipoAutorizacionPayload = (
  values: TipoAutorizacionDetailsFormValues,
  dirtyFields: Partial<Record<keyof TipoAutorizacionDetailsFormValues, boolean>>,
): UpdateTipoAutorizacionRequest => {
  const payload: UpdateTipoAutorizacionRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }
  if (dirtyFields.code && values.code !== undefined) {
    payload.code = values.code.trim();
  }

  return payload;
};
