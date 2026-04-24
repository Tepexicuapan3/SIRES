import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

export const areaDetailsSchema = z.object({
  name: requiredText("Nombre"),
  code: requiredText("Codigo", 40),
  idTipoArea: z.number({ error: "Tipo de área requerido" }).min(1, { error: "Tipo de área requerido" }),
});

export const createAreaSchema = areaDetailsSchema;

export type AreaDetailsFormValues = z.infer<typeof areaDetailsSchema>;
export type CreateAreaFormValues = z.infer<typeof createAreaSchema>;
