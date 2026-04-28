import { z } from "zod";

export const createCentroAreaClinicaSchema = z.object({
  centerId: z
    .number({ required_error: "Selecciona un centro de atención." })
    .min(1, "Selecciona un centro de atención."),
  areaClinicaId: z
    .number({ required_error: "Selecciona un área clínica." })
    .min(1, "Selecciona un área clínica."),
});

export type CreateCentroAreaClinicaFormValues = z.infer<
  typeof createCentroAreaClinicaSchema
>;
