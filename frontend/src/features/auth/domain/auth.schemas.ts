import { z } from "zod";
import { OTP_LENGTH, PASSWORD_REQUIREMENTS } from "./auth.rules";

const usernameSchema = z
  .string()
  .min(1, { error: "El usuario es requerido" })
  .max(20, { error: "Máximo 20 caracteres" })
  .regex(/^[a-zA-Z0-9]+$/, { error: "Solo letras y números" });

const passwordSchema = z
  .string()
  .min(1, { error: "La contraseña es requerida" });

const newPasswordSchema = PASSWORD_REQUIREMENTS.reduce(
  (schema, requirement) =>
    schema.refine(requirement.test, { message: requirement.message }),
  z.string(),
);

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const requestResetCodeSchema = z.object({
  email: z.email({ error: "Ingresa un correo válido" }),
});

export type RequestResetCodeFormData = z.infer<typeof requestResetCodeSchema>;

export const verifyResetCodeSchema = z.object({
  email: z.email({ error: "Ingresa un correo válido" }),
  code: z.string().length(OTP_LENGTH, {
    error: `El código debe tener ${OTP_LENGTH} dígitos`,
  }),
});

export type VerifyResetCodeFormData = z.infer<typeof verifyResetCodeSchema>;

export const authPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
      });
    }
  });

export type PasswordFormData = z.infer<typeof authPasswordSchema>;
