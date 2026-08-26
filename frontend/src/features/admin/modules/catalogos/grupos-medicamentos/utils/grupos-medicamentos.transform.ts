import type { GrupoMedicamentosDetail, CreateGrupoMedicamentosRequest, UpdateGrupoMedicamentosRequest } from "@api/types";
import type {
  GrupoMedicamentosDetailsFormValues,
  CreateGrupoMedicamentosFormValues,
} from "@features/admin/modules/catalogos/grupos-medicamentos/domain/grupos-medicamentos.schemas";

// =============================================================================
// API -> FORM
// =============================================================================

export const mapGrupoMedicamentosDetailToFormValues = (
  detail?: GrupoMedicamentosDetail | null,
): GrupoMedicamentosDetailsFormValues => ({
  name: detail?.name ?? "",
});

// =============================================================================
// FORM -> API
// =============================================================================

export const buildCreateGrupoMedicamentosPayload = (
  values: CreateGrupoMedicamentosFormValues,
): CreateGrupoMedicamentosRequest => ({
  name: values.name.trim(),
});

export const buildUpdateGrupoMedicamentosPayload = (
  values: GrupoMedicamentosDetailsFormValues,
  dirtyFields: Partial<Record<keyof GrupoMedicamentosDetailsFormValues, boolean>>,
): UpdateGrupoMedicamentosRequest => {
  const payload: UpdateGrupoMedicamentosRequest = {};

  if (dirtyFields.name && values.name !== undefined) {
    payload.name = values.name.trim();
  }

  return payload;
};
