import type { CreateCentroAreaClinicaRequest } from "@api/types";
import type { CreateCentroAreaClinicaFormValues } from "@features/admin/modules/catalogos/centro-area-clinica/domain/centro-area-clinica.schemas";

export const buildCreateCentroAreaClinicaPayload = (
  values: CreateCentroAreaClinicaFormValues,
): CreateCentroAreaClinicaRequest => ({
  centerId: values.centerId,
  areaClinicaId: values.areaClinicaId,
  isActive: true,
});
