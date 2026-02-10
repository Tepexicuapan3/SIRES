import { z } from "zod";

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(120);

const optionalText = z.string().trim().max(120);

const emailSchema = z.string().trim().email({ error: "Correo invalido" });

const optionalNumber = z.number().int().positive().nullable();

const requiredNumber = z
  .number()
  .int()
  .positive({ error: "Selecciona un rol" });

export const userDetailsSchema = z.object({
  firstName: requiredText("Nombre"),
  paternalName: requiredText("Apellido paterno"),
  maternalName: optionalText,
  email: emailSchema,
  clinicId: optionalNumber,
});

export const createUserSchema = z.object({
  username: z.string().trim().min(3, { error: "Usuario requerido" }).max(60),
  firstName: requiredText("Nombre"),
  paternalName: requiredText("Apellido paterno"),
  maternalName: optionalText,
  email: emailSchema,
  clinicId: optionalNumber,
  primaryRoleId: requiredNumber,
});

export type UserDetailsFormValues = z.infer<typeof userDetailsSchema>;
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
