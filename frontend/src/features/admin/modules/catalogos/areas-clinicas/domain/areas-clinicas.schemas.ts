import * as z from "zod";

const requiredText = (label: string, maxLength = 150) =>
  z.string().trim().min(1, { error: `${label} requerido` }).max(maxLength);

export const areaClinicaDetailsSchema = z.object({
  name: requiredText("Nombre", 150),
});

export const createAreaClinicaSchema = areaClinicaDetailsSchema;

export type AreaClinicaDetailsFormValues = z.infer<typeof areaClinicaDetailsSchema>;
export type CreateAreaClinicaFormValues = z.infer<typeof createAreaClinicaSchema>;
