import type { LicenciaDetail, CreateLicenciaRequest, UpdateLicenciaRequest } from "@api/types";
import type {
  LicenciaDetailsFormValues,
  CreateLicenciaFormValues,
} from "@features/admin/modules/catalogos/licencias/domain/licencias.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapLicenciaDetailToFormValues = (
  detail?: LicenciaDetail | null,
): LicenciaDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateLicenciaPayload = (
  values: CreateLicenciaFormValues,
): CreateLicenciaRequest => ({
  name: values.name.trim(),
});

export const buildUpdateLicenciaPayload = (
  values: LicenciaDetailsFormValues,
  dirtyFields: Partial<Record<keyof LicenciaDetailsFormValues, boolean>>,
): UpdateLicenciaRequest => {
  const payload: UpdateLicenciaRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
