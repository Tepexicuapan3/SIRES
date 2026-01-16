import { describe, it, expect } from "vitest";
import { authAPI } from "@/api/resources/auth.api";

describe("Auth API Integration (with MSW)", () => {
  
  // 1. Test de Login
  it("should login successfully and return user data", async () => {
    const response = await authAPI.login({
      usuario: "test_user",
      clave: "password123"
    });

    expect(response.user).toBeDefined();
    expect(response.user.id_usuario).toBeGreaterThan(0);
    // Verificamos que sea un token Bearer (como definimos en el mock)
    expect(response.token_type).toBe("Bearer");
  });

  // 2. Test de Logout
  it("should logout successfully", async () => {
    // No retorna nada, pero no debe lanzar error
    await expect(authAPI.logout()).resolves.not.toThrow();
  });

  // 3. Test de Flujo de Recuperación de Contraseña (3 pasos)
  describe("Password Recovery Flow", () => {
    
    it("Step 1: should request reset code", async () => {
      // Paso 1: Solicitar
      await expect(authAPI.requestResetCode({ email: "test@example.com" }))
        .resolves.not.toThrow();
    });

    it("Step 2: should verify correct OTP code", async () => {
      // Paso 2: Verificar (usamos el código "123456" que hardcodeamos en el mock)
      const response = await authAPI.verifyResetCode({
        email: "test@example.com",
        code: "123456"
      });

      expect(response.valid).toBe(true);
      expect(response.reset_token).toBeDefined();
    });

    it("Step 2 (Fail): should reject incorrect OTP code", async () => {
      // Paso 2: Verificar código incorrecto
      await expect(authAPI.verifyResetCode({
        email: "test@example.com",
        code: "999999" // Código incorrecto
      })).rejects.toThrow(); // Axios lanza error en 400
    });

    it("Step 3: should reset password", async () => {
      // Paso 3: Reset final
      // Nota: En la app real el token iría en cookie, aquí simulamos la llamada
      const response = await authAPI.resetPassword({
        new_password: "NewPassword123!"
      });

      expect(response.message).toContain("correctamente");
    });
  });

  // 4. Test de Onboarding
  it("should complete onboarding process", async () => {
    const response = await authAPI.completeOnboarding({
      new_password: "MyNewPassword123!",
      terms_accepted: true
    });

    expect(response.success).toBe(true);
    expect(response.user.must_change_password).toBe(false);
  });

});
