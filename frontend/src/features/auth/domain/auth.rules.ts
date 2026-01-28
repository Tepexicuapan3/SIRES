export const OTP_LENGTH = 6;
export const OTP_MAX_ATTEMPTS = 3;

const MASK_CHAR = "\u2022";
const MAX_MASK_LENGTH = 6;

export type PasswordRequirementId =
  | "length"
  | "uppercase"
  | "number"
  | "special";

export interface PasswordRequirement {
  id: PasswordRequirementId;
  label: string;
  message: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "Mínimo 8 caracteres",
    message: "Mínimo 8 caracteres",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Al menos una mayúscula (A-Z)",
    message: "Al menos una mayúscula",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "Al menos un número (0-9)",
    message: "Al menos un número",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "Al menos un carácter especial (@, #, $, etc.)",
    message: "Al menos un carácter especial (@, #, etc.)",
    test: (password) => /[^a-zA-Z0-9]/.test(password),
  },
];

export const getPasswordRequirementStatus = (password: string) =>
  PASSWORD_REQUIREMENTS.map((requirement) => ({
    requirement,
    isMet: requirement.test(password),
  }));

export const isPasswordStrong = (password: string) =>
  PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));

export const obfuscateEmail = (email: string) =>
  email.replace(
    /(.{2})(.*)(@.*)/,
    (_, start, middle, end) =>
      `${start}${MASK_CHAR.repeat(Math.min(middle.length, MAX_MASK_LENGTH))}${end}`,
  );
