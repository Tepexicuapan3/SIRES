import type {
  LoginRequest,
  LoginResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  CompleteOnboardingRequest,
  RequestResetCodeRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  Usuario,
  RefreshTokenResponse,
  IAuthAPI,
} from "../types/auth.types";

// ===== INTEGRACIÓN CON SISTEMA RBAC 2.0 =====
import { validateMockCredentials, mockLoginResponse } from "@/mocks";

// ==============================================================
// CONFIGURACION DE MOCKS
// ==============================================================

/** Delay base para simular latencia de red (ms) */
const NETWORK_DELAY = 1500;

/** Delay corto para operaciones rápidas (ms) */
const SHORT_DELAY = 1000;

// ==============================================================
// HELPERS
// ==============================================================

/** Simula una espera de red */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper para simular un AxiosError estándar
 */
const createMockError = (code: string, message: string, status: number) => {
  const error = new Error(message) as Error & {
    response: { status: number; data: { code: string; message: string } };
  };
  error.response = {
    status: status,
    data: {
      code: code,
      message: message,
    },
  };
  return error;
};

/**
 * Helper para simular errores de Rate Limiting con retry_after
 */
const createRateLimitError = (
  code: "TOO_MANY_REQUESTS" | "IP_BLOCKED" | "USER_LOCKED",
  message: string,
  status: number,
  retryAfterSeconds: number,
) => {
  const error = new Error(message) as Error & {
    response: {
      status: number;
      data: { code: string; message: string; retry_after: number };
    };
  };
  error.response = {
    status: status,
    data: {
      code: code,
      message: message,
      retry_after: retryAfterSeconds,
    },
  };
  return error;
};

/**
 * Genera un usuario mock con datos completos
 * Incluye campos RBAC 2.0: permissions, landing_route, is_admin
 */
const createMockUser = (overrides: Partial<Usuario> = {}): Usuario => ({
  id_usuario: 1,
  usuario: "admin",
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
  // ===== RBAC 2.0 - Campos obligatorios =====
  permissions: ["*"], // Admin tiene wildcard (todos los permisos)
  landing_route: "/admin", // Admins van a panel de administración
  is_admin: true, // Flag de bypass de permisos
  ...overrides,
});

/**
 * Genera una respuesta de login exitosa
 */
const createLoginResponse = (user: Usuario): LoginResponse => ({
  token_type: "Bearer",
  expires_in: 3600,
  user,
});

// ==============================================================
// TABLA DE USUARIOS DE PRUEBA (RBAC 2.0)
// ==============================================================
/**
 * USUARIOS DE PRUEBA DISPONIBLES (sincronizados con @/mocks/users.mock.ts):
 *
 * Ver documentación completa en: frontend/src/mocks/README.md
 *
 * USUARIOS REALES (permisos sincronizados con backend/migrations/004_rbac_assign_permissions.sql):
 *
 * | Usuario       | Contraseña  | Rol Principal          | Permisos | Landing       | Descripción                    |
 * |---------------|-------------|------------------------|----------|---------------|--------------------------------|
 * | admin         | Admin123!   | ADMINISTRADOR          | ["*"]    | /admin        | Acceso total al sistema        |
 * | drgarcia      | Doc123!     | MEDICOS                | 15       | /consultas    | Médico general                 |
 * | drlopez       | Esp123!     | ESPECIALISTAS          | 16       | /consultas    | Médico especialista            |
 * | recep01       | Recep123!   | RECEPCION              | 10       | /recepcion    | Recepcionista                  |
 * | farm01        | Farm123!    | FARMACIA               | 6        | /farmacia     | Farmacéutico                   |
 * | urg01         | Urg123!     | URGENCIAS              | 13       | /urgencias    | Médico de urgencias            |
 * | coordhosp     | Hosp123!    | HOSP-COORDINACION      | 5        | /hospital     | Coordinador hospitalización    |
 * | gerente01     | Ger123!     | GERENCIA               | 11       | /reportes     | Gerente/director               |
 * | jefeclinica   | Jefe123!    | JEFATURA CLINICA       | 20       | /consultas    | Jefe de área clínica           |
 * | trans01       | Trans123!   | TRANS-RECETA           | 5        | /farmacia     | Transcriptor de recetas        |
 *
 * USUARIOS DE ERROR (para testing de casos edge):
 *
 * | Usuario       | Contraseña  | Resultado                                     |
 * |---------------|-------------|-----------------------------------------------|
 * | inactivo      | cualquiera  | ❌ 403 USER_INACTIVE                          |
 * | noexiste      | cualquiera  | ❌ 404 USER_NOT_FOUND                         |
 * | error         | cualquiera  | ❌ 401 INVALID_CREDENTIALS                    |
 * | cualquiera    | mal         | ❌ 401 INVALID_CREDENTIALS                    |
 * | fail          | cualquiera  | ❌ 500 INTERNAL_SERVER_ERROR                  |
 * | bloqueado     | cualquiera  | ❌ 423 USER_LOCKED (5 min)                    |
 * | bloqueado1h   | cualquiera  | ❌ 423 USER_LOCKED (1 hora)                   |
 * | bloqueado24h  | cualquiera  | ❌ 423 USER_LOCKED (24 horas)                 |
 * | ratelimit     | cualquiera  | ❌ 429 TOO_MANY_REQUESTS (1 min)              |
 * | ratelimit5    | cualquiera  | ❌ 429 TOO_MANY_REQUESTS (5 min)              |
 * | ipblock       | cualquiera  | ❌ 403 IP_BLOCKED (15 min)                    |
 * | ipblock1h     | cualquiera  | ❌ 403 IP_BLOCKED (1 hora)                    |
 * | ipblock24h    | cualquiera  | ❌ 403 IP_BLOCKED (24 horas)                  |
 *
 * CONTRASEÑAS DE PRUEBA PARA ONBOARDING Y RESET PASSWORD:
 *
 * | Contraseña       | Resultado                                |
 * |------------------|------------------------------------------|
 * | Corta1@          | ❌ 400 PASSWORD_TOO_SHORT                |
 * | sinmayuscula1@   | ❌ 400 PASSWORD_NO_UPPERCASE             |
 * | SinNumero@       | ❌ 400 PASSWORD_NO_NUMBER                |
 * | SinEspecial1     | ❌ 400 PASSWORD_NO_SPECIAL               |
 * | Expirado1@       | ❌ 403 INVALID_SCOPE                     |
 * | YaActivo1@       | ❌ 400 ONBOARDING_NOT_REQUIRED           |
 * | Cualquier otra   | ✅ Éxito + auto-login                    |
 */

// ==============================================================
// IMPLEMENTACIÓN DE MOCKS
// ==============================================================

export const authMocks: IAuthAPI = {
  /**
   * 1. SIMULACIÓN DE LOGIN (RBAC 2.0)
   *
   * Usa el sistema de usuarios sincronizado con la BD real (MOCK_USERS_DB).
   * Soporta usuarios de error para testing de edge cases.
   *
   * Ver tabla de usuarios arriba para todos los casos disponibles.
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await delay(NETWORK_DELAY);

    const username = data.usuario.toLowerCase();

    console.log(`🧪 [MOCK AUTH] Intento de login: ${username}`);

    // =========================================================
    // ERRORES DE RATE LIMITING (Usuarios de prueba)
    // =========================================================

    // Usuario bloqueado por intentos fallidos - 5 minutos
    if (username === "bloqueado") {
      throw createRateLimitError(
        "USER_LOCKED",
        "Usuario bloqueado por demasiados intentos fallidos.",
        423,
        300, // 5 minutos
      );
    }

    // Usuario bloqueado - 1 hora
    if (username === "bloqueado1h") {
      throw createRateLimitError(
        "USER_LOCKED",
        "Usuario bloqueado por demasiados intentos fallidos.",
        423,
        3600, // 1 hora
      );
    }

    // Usuario bloqueado - 24 horas
    if (username === "bloqueado24h") {
      throw createRateLimitError(
        "USER_LOCKED",
        "Usuario bloqueado por demasiados intentos fallidos.",
        423,
        86400, // 24 horas
      );
    }

    // Rate limit por IP - 1 minuto
    if (username === "ratelimit") {
      throw createRateLimitError(
        "TOO_MANY_REQUESTS",
        "Demasiadas solicitudes desde tu dirección.",
        429,
        60, // 1 minuto
      );
    }

    // Rate limit por IP - 5 minutos
    if (username === "ratelimit5") {
      throw createRateLimitError(
        "TOO_MANY_REQUESTS",
        "Demasiadas solicitudes desde tu dirección.",
        429,
        300, // 5 minutos
      );
    }

    // IP bloqueada - 15 minutos
    if (username === "ipblock") {
      throw createRateLimitError(
        "IP_BLOCKED",
        "Tu dirección IP ha sido bloqueada temporalmente.",
        403,
        900, // 15 minutos
      );
    }

    // IP bloqueada - 1 hora
    if (username === "ipblock1h") {
      throw createRateLimitError(
        "IP_BLOCKED",
        "Tu dirección IP ha sido bloqueada temporalmente.",
        403,
        3600, // 1 hora
      );
    }

    // IP bloqueada - 24 horas
    if (username === "ipblock24h") {
      throw createRateLimitError(
        "IP_BLOCKED",
        "Tu dirección IP ha sido bloqueada por actividad sospechosa.",
        403,
        86400, // 24 horas
      );
    }

    // =========================================================
    // ERRORES DE AUTENTICACIÓN (Usuarios de prueba)
    // =========================================================

    // Usuario inactivo
    if (username === "inactivo") {
      throw createMockError(
        "USER_INACTIVE",
        "El usuario está deshabilitado administrativamente.",
        403,
      );
    }

    // Usuario no encontrado
    if (username === "noexiste") {
      throw createMockError(
        "USER_NOT_FOUND",
        "El usuario ingresado no existe en el sistema.",
        404,
      );
    }

    // Credenciales inválidas (trigger explícito)
    if (username === "error" || data.clave === "mal") {
      throw createMockError(
        "INVALID_CREDENTIALS",
        "Usuario o contraseña incorrectos.",
        401,
      );
    }

    // Error del servidor
    if (username === "fail") {
      throw createMockError(
        "INTERNAL_SERVER_ERROR",
        "Error de conexión con base de datos.",
        500,
      );
    }

    // =========================================================
    // USUARIOS REALES (Sistema RBAC 2.0)
    // =========================================================

    // Validar credenciales usando el sistema RBAC 2.0
    const isValid = validateMockCredentials(data.usuario, data.clave);

    if (!isValid) {
      console.log(`🧪 [MOCK AUTH] Credenciales inválidas para: ${username}`);
      throw createMockError(
        "INVALID_CREDENTIALS",
        "Usuario o contraseña incorrectos.",
        401,
      );
    }

    // Obtener respuesta del mock usando el helper RBAC 2.0
    const response = mockLoginResponse(data.usuario);

    if (!response) {
      console.log(
        `🧪 [MOCK AUTH] Usuario no encontrado en MOCK_USERS_DB: ${username}`,
      );
      throw createMockError(
        "USER_NOT_FOUND",
        "El usuario ingresado no existe en el sistema.",
        404,
      );
    }

    console.log(`🧪 [MOCK AUTH] Login exitoso:`, {
      usuario: response.user.usuario,
      roles: response.user.roles,
      permissions: response.user.permissions.length,
      landing: response.user.landing_route,
    });

    return response;
  },

  /**
   * 2. SIMULACIÓN DE ONBOARDING
   *
   * Casos de prueba según la contraseña:
   * - "Corta1@"      → Error PASSWORD_TOO_SHORT
   * - "sinmayuscula1@" → Error PASSWORD_NO_UPPERCASE
   * - "SinNumero@"   → Error PASSWORD_NO_NUMBER
   * - "SinEspecial1" → Error PASSWORD_NO_SPECIAL
   * - "Expirado1@"   → Error INVALID_SCOPE (token expirado)
   * - "YaActivo1@"   → Error ONBOARDING_NOT_REQUIRED
   * - Cualquier otra → Éxito
   */
  completeOnboarding: async (
    data: CompleteOnboardingRequest,
  ): Promise<LoginResponse> => {
    await delay(NETWORK_DELAY);

    const password = data.new_password;

    // Simular errores de validación de contraseña
    if (password === "Corta1@") {
      throw createMockError(
        "PASSWORD_TOO_SHORT",
        "La contraseña debe tener al menos 8 caracteres.",
        400,
      );
    }

    if (password === "sinmayuscula1@") {
      throw createMockError(
        "PASSWORD_NO_UPPERCASE",
        "La contraseña debe incluir al menos una letra mayúscula.",
        400,
      );
    }

    if (password === "SinNumero@") {
      throw createMockError(
        "PASSWORD_NO_NUMBER",
        "La contraseña debe incluir al menos un número.",
        400,
      );
    }

    if (password === "SinEspecial1") {
      throw createMockError(
        "PASSWORD_NO_SPECIAL",
        "La contraseña debe incluir al menos un carácter especial.",
        400,
      );
    }

    // Simular token expirado
    if (password === "Expirado1@") {
      throw createMockError(
        "INVALID_SCOPE",
        "Token no autorizado para completar onboarding. Inicia sesión nuevamente.",
        403,
      );
    }

    // Simular usuario que ya completó onboarding
    if (password === "YaActivo1@") {
      throw createMockError(
        "ONBOARDING_NOT_REQUIRED",
        "El usuario ya completó el proceso de activación.",
        400,
      );
    }

    // Éxito: Retornar respuesta completa con nuevos tokens
    return createLoginResponse(
      createMockUser({
        id_usuario: 99,
        usuario: "usuario_onboarding",
        nombre: "Usuario",
        paterno: "Onboarding",
        materno: "Completo",
        nombre_completo: "Usuario Onboarding Completo",
        expediente: "ONB001",
        ing_perfil: "Médico",
        roles: ["ROL_MEDICO"],
        must_change_password: false,
        // RBAC 2.0: Permisos asignados después de onboarding
        permissions: [
          "expedientes:create",
          "expedientes:read",
          "expedientes:update",
          "consultas:create",
          "consultas:read",
          "pacientes:read",
        ],
        landing_route: "/consultas",
        is_admin: false,
      }),
    );
  },

  /**
   * 3. SIMULACIÓN DE LOGOUT
   */
  logout: async (): Promise<void> => {
    await delay(SHORT_DELAY);
    console.log("MOCK: Sesión cerrada correctamente");
  },

  /**
   * 4. SIMULACIÓN DE REFRESH TOKEN
   * With HttpOnly cookies, token comes from cookie - no param needed
   */
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    await delay(SHORT_DELAY);
    return {
      token_type: "Bearer",
      expires_in: 3600,
    };
  },

  /**
   * 5. SIMULACIÓN DE OBTENER USUARIO ACTUAL (RBAC 2.0)
   *
   * Retorna el usuario guardado en Zustand authStore.
   * Si no hay usuario en authStore, simula un usuario admin por defecto.
   */
  getCurrentUser: async (): Promise<Usuario> => {
    await delay(SHORT_DELAY);

    console.log("🧪 [MOCK AUTH] getCurrentUser llamado");

    // En modo mock, Zustand persiste el usuario en localStorage
    // El key es "sires-auth-storage" (ver authStore.ts línea 74)
    const storedAuth = localStorage.getItem("sires-auth-storage");

    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.state?.user) {
          console.log(
            "🧪 [MOCK AUTH] Usuario encontrado en localStorage:",
            parsed.state.user.usuario,
          );
          return parsed.state.user;
        }
      } catch (e) {
        console.warn("🧪 [MOCK AUTH] Error parseando localStorage", e);
      }
    }

    // Fallback: retornar admin por defecto
    console.log(
      "🧪 [MOCK AUTH] No hay usuario en localStorage, retornando admin por defecto",
    );
    return createMockUser();
  },

  /**
   * 6. SIMULACIÓN DE VERIFICAR TOKEN
   */
  verifyToken: async (): Promise<boolean> => {
    await delay(500);
    return true;
  },

  /**
   * 7. SIMULACIÓN DE SOLICITAR CÓDIGO OTP
   *
   * Siempre retorna éxito (simula envío de email)
   */
  requestResetCode: async (data: RequestResetCodeRequest): Promise<void> => {
    await delay(SHORT_DELAY);
    console.log(`MOCK: Código OTP enviado a ${data.email}`);
    console.log("MOCK: Usa el código '123456' para verificar");
  },

  /**
   * 8. SIMULACIÓN DE VERIFICAR CÓDIGO OTP
   *
   * Códigos de prueba:
   * - 123456: Verificación exitosa
   * - 000000: Código expirado
   * - 999999: Demasiados intentos
   * - otro:   Código incorrecto
   */
  verifyResetCode: async (
    data: VerifyResetCodeRequest,
  ): Promise<VerifyResetCodeResponse> => {
    await delay(SHORT_DELAY);

    // Código expirado
    if (data.code === "000000") {
      throw createMockError(
        "CODE_EXPIRED",
        "El código ha expirado. Solicita uno nuevo.",
        400,
      );
    }

    // Demasiados intentos
    if (data.code === "999999") {
      throw createRateLimitError(
        "TOO_MANY_REQUESTS",
        "Demasiados intentos de verificación.",
        429,
        600, // 10 minutos
      );
    }

    // Código incorrecto
    if (data.code !== "123456") {
      throw createMockError(
        "INVALID_CODE",
        "El código ingresado es incorrecto.",
        400,
      );
    }

    // Código válido
    return {
      valid: true,
    };
  },

  /**
   * 9. SIMULACIÓN DE RESTABLECER CONTRASEÑA
   *
   * Casos de prueba según la contraseña:
   * - "Corta1@"        → Error PASSWORD_TOO_SHORT
   * - "sinmayuscula1@" → Error PASSWORD_NO_UPPERCASE
   * - "SinNumero@"     → Error PASSWORD_NO_NUMBER
   * - "SinEspecial1"   → Error PASSWORD_NO_SPECIAL
   * - "Expirado1@"     → Error INVALID_SCOPE (token expirado)
   * - Cualquier otra   → Éxito con tokens nuevos
   */
  resetPassword: async (
    data: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> => {
    await delay(NETWORK_DELAY);

    const password = data.new_password;

    // Simular errores de validación de contraseña
    if (password === "Corta1@") {
      throw createMockError(
        "PASSWORD_TOO_SHORT",
        "La contraseña debe tener al menos 8 caracteres.",
        400,
      );
    }

    if (password === "sinmayuscula1@") {
      throw createMockError(
        "PASSWORD_NO_UPPERCASE",
        "La contraseña debe incluir al menos una letra mayúscula.",
        400,
      );
    }

    if (password === "SinNumero@") {
      throw createMockError(
        "PASSWORD_NO_NUMBER",
        "La contraseña debe incluir al menos un número.",
        400,
      );
    }

    if (password === "SinEspecial1") {
      throw createMockError(
        "PASSWORD_NO_SPECIAL",
        "La contraseña debe incluir al menos un carácter especial.",
        400,
      );
    }

    // Simular token expirado
    if (password === "Expirado1@") {
      throw createMockError(
        "INVALID_SCOPE",
        "Token no autorizado para restablecer contraseña. Solicita uno nuevo.",
        403,
      );
    }

    console.log("MOCK: Contraseña restablecida exitosamente");

    // Éxito: Retornar respuesta completa con nuevos tokens (igual que login/onboarding)
    return createLoginResponse(
      createMockUser({
        id_usuario: 50,
        usuario: "usuario_recovery",
        nombre: "Usuario",
        paterno: "Recuperado",
        materno: "Sistema",
        nombre_completo: "Usuario Recuperado Sistema",
        expediente: "REC001",
        ing_perfil: "Usuario",
        roles: ["ROL_MEDICO"],
        must_change_password: false,
        // RBAC 2.0: Permisos restaurados después de recovery
        permissions: [
          "expedientes:read",
          "consultas:create",
          "consultas:read",
          "pacientes:read",
        ],
        landing_route: "/consultas",
        is_admin: false,
      }),
    );
  },
};

// ==============================================================
// HELPERS INTERNOS (No exportados - uso solo dentro de este archivo)
// ==============================================================
// Si en el futuro necesitas estos helpers para tests, descomenta el export:
// export const mockHelpers = { createMockError, createRateLimitError, createMockUser, createLoginResponse, delay };
