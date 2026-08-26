import * as z from "zod";

const requiredText = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(maxLength);

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .or(z.literal(""));

const requiredFk = (label: string) =>
  z.number({ error: `${label} requerido` }).min(1, { error: `${label} requerido` });

export const autorizadorDetailsSchema = z.object({
  name: requiredText("Nombre", 100),
  position: requiredText("Cargo", 60),
  centerId: requiredFk("Centro de atención"),
  authorizationTypeId: requiredFk("Tipo de autorización"),
  userId: requiredFk("Usuario"),
  authorizerPassword: optionalText(20),
  fileNumber: optionalText(8),
  signatureImage: optionalText(200),
});

export const createAutorizadorSchema = autorizadorDetailsSchema.extend({
  authorizerPassword: requiredText("Contraseña", 20),
});

export type AutorizadorDetailsFormValues = z.infer<typeof autorizadorDetailsSchema>;
export type CreateAutorizadorFormValues = z.infer<typeof createAutorizadorSchema>;
