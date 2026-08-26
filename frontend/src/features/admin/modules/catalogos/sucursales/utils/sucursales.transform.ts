import type { SucursalDetail, UpdateSucursalRequest } from "@api/types";
import type { SucursalDetailsFormValues } from "@features/admin/modules/catalogos/sucursales/domain/sucursales.schemas";

export const mapSucursalDetailToFormValues = (
  detail?: SucursalDetail | null,
): SucursalDetailsFormValues => ({
  name: detail?.name ?? "",
});

export const buildUpdateSucursalPayload = (
  values: SucursalDetailsFormValues,
  dirtyFields: Partial<Record<keyof SucursalDetailsFormValues, boolean>>,
): UpdateSucursalRequest => {
  const payload: UpdateSucursalRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
