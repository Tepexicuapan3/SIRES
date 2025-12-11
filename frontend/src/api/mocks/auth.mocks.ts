import {
  LoginRequest,
  LoginResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  CompleteOnboardingRequest,
  RequestResetCodeRequest,
  ResetPasswordRequest,
} from "../types/auth.types";

// Simula una espera de red
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper para simular un AxiosError
 */
const createMockError = (code: string, message: string, status: number) => {
  const error: any = new Error(message);
  error.response = {
    status: status,
    data: {
      code: code,
      message: message,
    },
  };
  return error;
};

export const authMocks = {
  // 1. Simulación de Login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await delay(1500); // 1.5s para ver el spinner

    // =========================================================
    // CASOS DE ERROR (Backend rechaza)
    // =========================================================

    // Caso 1: Usuario Inactivo (Bloqueado por Backend 403)
    if (data.usuario === "inactivo") {
      throw createMockError(
        "USER_INACTIVE",
        "El usuario está deshabilitado administrativamente.",
        403
      );
    }

    // Caso 2: Usuario No Encontrado
    if (data.usuario === "noexiste") {
      throw createMockError(
        "USER_NOT_FOUND",
        "El usuario ingresado no existe en el sistema.",
        404
      );
    }

    // Caso 3: Contraseña Incorrecta
    // Simulamos que si la clave es "mal", falla
    if (data.usuario === "error" || data.clave === "mal") {
      throw createMockError(
        "INVALID_CREDENTIALS",
        "La contraseña proporcionada es incorrecta.",
        401
      );
    }

    // Caso 4: Error Genérico (500)
    if (data.usuario === "fail") {
      throw createMockError(
        "INTERNAL_SERVER_ERROR",
        "Error de conexión con base de datos.",
        500
      );
    }

    // =========================================================
    // CASOS DE ÉXITO (Backend responde 200 OK)
    // =========================================================

    // Caso 5: Usuario Nuevo (Onboarding)
    if (data.usuario === "nuevo") {
      return {
        access_token: "mock_token_pre_auth",
        refresh_token: "mock_refresh_pre_auth",
        token_type: "Bearer",
        expires_in: 3600,
        user: {
          id_usuario: 99,
          usuario: "nuevo",
          nombre: "Usuario Nuevo",
          paterno: "Test",
          materno: "Test",
          nombre_completo: "Usuario Nuevo Test",
          expediente: "12345",
          curp: "TEST999999XXXXXX00",
          correo: "nuevo@metro.cdmx.gob.mx",
          ing_perfil: "Nuevo Ingreso",
          roles: [],
          must_change_password: true, // <--- Activa Onboarding
        },
      };
    }

    // Caso 6: Login Exitoso (Admin / Dashboard)
    return {
      access_token: "mock_token_full_access",
      refresh_token: "mock_refresh_full",
      token_type: "Bearer",
      expires_in: 3600,
      user: {
        id_usuario: 1,
        usuario: data.usuario,
        nombre: "Juan",
        paterno: "Pérez",
        materno: "López",
        nombre_completo: "Juan Pérez López",
        expediente: "54321",
        curp: "JUAN800101HDFRRN01",
        correo: "juan.perez@metro.cdmx.gob.mx",
        ing_perfil: "Administrador",
        roles: ["ADMIN", "ROL_MEDICO"],
        must_change_password: false,
      },
    };
  },

  // 2. Simulación de Onboarding
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
  },

  // 4. Simulación verificar código
  verifyResetCode: async (
    data: VerifyResetCodeRequest
  ): Promise<VerifyResetCodeResponse> => {
    await delay(1000);

    if (data.code !== "123456") {
      throw createMockError("INVALID_CODE", "Código inválido o expirado", 400);
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
