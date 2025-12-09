import {
  LoginRequest,
  LoginResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  CompleteOnboardingRequest,
  RequestResetCodeRequest,
  ResetPasswordRequest,
} from "../types/auth.types";

// Simula una espera de red (ej. 1 segundo)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authMocks = {
  // 1. Simulación de Login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await delay(1000); // Esperar 1 seg

    // === CASO C: Usuario que da ERROR (Para probar limpieza de input) ===
    if (data.usuario === "error") {
      // Lanzamos un error para que React Query active el 'onError'
      throw new Error("Credenciales inválidas (Simulación)");
    }

    // === CASO A: Usuario Nuevo (Para probar Onboarding) ===
    if (data.usuario === "nuevo") {
      return {
        access_token: "mock_token_pre_auth_12345",
        user: {
          id: 99,
          nombre: "Usuario Nuevo",
          must_change_password: true,
          roles: [],
        },
      };
    }

    // === CASO B: Usuario Normal (Dashboard) ===
    // Cualquier otro usuario entra aquí
    return {
      access_token: "mock_token_full_access_99999",
      user: {
        id: 1,
        nombre: "Juan Pérez",
        must_change_password: false,
        roles: ["ADMIN"],
      },
    };
  },

  // 2. Simulación de Onboarding
  // Aunque no usemos 'data' en el mock, lo tipamos para mantener contrato
  completeOnboarding: async (
    _data: CompleteOnboardingRequest
  ): Promise<{ access_token: string }> => {
    await delay(1500);
    return {
      access_token: "mock_token_final_definitivo",
    };
  },

  // 3. Simulación pedir código
  requestResetCode: async (_data: RequestResetCodeRequest): Promise<void> => {
    await delay(1000);
    console.log("MOCK: Código enviado al correo imaginario");
    // No retorna nada, solo éxito 200 OK
  },

  // 4. Simulación verificar código
  verifyResetCode: async (
    data: VerifyResetCodeRequest
  ): Promise<VerifyResetCodeResponse> => {
    await delay(1000);

    // Validar un código específico para probar error vs éxito
    if (data.code !== "123456") {
      throw new Error("Código inválido (Mock)");
    }

    return {
      valid: true,
      reset_token: "mock_reset_token_secret_key",
    };
  },

  // 5. Simulación cambio de password
  resetPassword: async (_data: ResetPasswordRequest): Promise<void> => {
    await delay(1500);
    console.log("MOCK: Contraseña cambiada con éxito");
  },
};
