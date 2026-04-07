import * as z from "zod";

const requiredText = (label: string) =>
  z
    .string({ error: `${label} requerido` })
    .trim()
    .min(1, { error: `${label} requerido` })
    .max(120, { error: `${label} demasiado largo` });

const optionalText = z
  .string({ error: "Texto invalido" })
  .trim()
  .max(120, { error: "Texto demasiado largo" });

const emailSchema = z
  .string({ error: "Correo invalido" })
  .trim()
  .email({ error: "Correo invalido" });

const optionalNumber = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === "none" ||
      value === 0 ||
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return value;
  },
  z
    .number({ error: "Selecciona un centro valido" })
    .int()
    .positive({ error: "Selecciona un centro valido" })
    .nullable()
    .default(null),
);

const requiredNumber = z
  .number({ error: "Selecciona un rol" })
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
  username: z
    .string({ error: "Usuario requerido" })
    .trim()
    .min(3, { error: "Usuario requerido" })
    .max(60, { error: "Usuario demasiado largo" }),
  firstName: requiredText("Nombre"),
  paternalName: requiredText("Apellido paterno"),
  maternalName: optionalText,
  email: emailSchema,
  clinicId: optionalNumber,
  primaryRoleId: requiredNumber,
});

export type UserDetailsFormValues = z.infer<typeof userDetailsSchema>;
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
