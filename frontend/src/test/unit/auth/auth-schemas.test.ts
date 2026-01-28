import { describe, it, expect } from "vitest";
import {
  authPasswordSchema,
  loginSchema,
  requestResetCodeSchema,
  verifyResetCodeSchema,
} from "@/features/auth/domain/auth.schemas";

describe("auth schemas", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      username: "usuario123",
      password: "password123",
      rememberMe: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects username with invalid characters", () => {
    const result = loginSchema.safeParse({
      username: "user-123",
      password: "password123",
      rememberMe: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({
      username: "usuario123",
      password: "",
      rememberMe: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid reset code request", () => {
    const result = requestResetCodeSchema.safeParse({
      email: "usuario@metro.cdmx.gob.mx",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid emails in reset code request", () => {
    const result = requestResetCodeSchema.safeParse({
      email: "no-es-email",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid OTP verification payload", () => {
    const result = verifyResetCodeSchema.safeParse({
      email: "usuario@metro.cdmx.gob.mx",
      code: "123456",
    });

    expect(result.success).toBe(true);
  });

  it("rejects OTP payloads with invalid code length", () => {
    const result = verifyResetCodeSchema.safeParse({
      email: "usuario@metro.cdmx.gob.mx",
      code: "123",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a strong password with matching confirmation", () => {
    const result = authPasswordSchema.safeParse({
      newPassword: "SecurePass123!",
      confirmPassword: "SecurePass123!",
    });

    expect(result.success).toBe(true);
  });

  it("rejects passwords without uppercase letters", () => {
    const result = authPasswordSchema.safeParse({
      newPassword: "securepass123!",
      confirmPassword: "securepass123!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = authPasswordSchema.safeParse({
      newPassword: "Aa1!",
      confirmPassword: "Aa1!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects passwords without numbers", () => {
    const result = authPasswordSchema.safeParse({
      newPassword: "SecurePass!!!",
      confirmPassword: "SecurePass!!!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects passwords without special characters", () => {
    const result = authPasswordSchema.safeParse({
      newPassword: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects password mismatches", () => {
    const result = authPasswordSchema.safeParse({
      newPassword: "SecurePass123!",
      confirmPassword: "SecurePass123?",
    });

    expect(result.success).toBe(false);
  });
});
