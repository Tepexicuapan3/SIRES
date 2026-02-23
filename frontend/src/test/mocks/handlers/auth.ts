import { http, HttpResponse, delay } from "msw";
import type { AuthUser } from "@/api/types/auth.types";
import { createMockAuthUser } from "../../factories/users";
import { getApiUrl } from "../urls";
import {
  clearMockSessionUser,
  getMockSessionUser,
  resetMockSessionUser,
  setMockSessionUser,
} from "../session";
import { resetRolesMockState } from "./roles";
import { resetUsersMockState } from "./users";

interface LoginScenario {
  user: AuthUser;
  requiresOnboarding?: boolean;
}

const MOCK_DELAY = {
  auth: 900,
  short: 600,
  long: 1200,
};

const testUserOverrides = new Map<
  string,
  { requiresOnboarding?: boolean; mustChangePassword?: boolean }
>();

const resetCodeStore = new Map<string, string>();

const ACCESS_TOKEN_COOKIE = "access_token_cookie";
const REFRESH_TOKEN_COOKIE = "refresh_token_cookie";
const CSRF_COOKIE = "csrf_token";
const COOKIE_PATH = "Path=/";
const COOKIE_SAME_SITE = "SameSite=Lax";

// Función helper para validar contraseñas robustas (replica lógica de Zod del frontend)
const isPasswordStrong = (password: string): boolean => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

  return hasMinLength && hasUpperCase && hasNumber && hasSpecialChar;
};

// Helper para crear respuesta de login consistente
const createLoginResponse = (user: AuthUser, requiresOnboarding = false) => {
  const tokenValue = encodeURIComponent(user.username);
  const csrfToken = `csrf_${tokenValue}`;

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=${tokenValue}; ${COOKIE_PATH}; HttpOnly; ${COOKIE_SAME_SITE}`,
  );
  headers.append(
    "Set-Cookie",
    `${REFRESH_TOKEN_COOKIE}=${tokenValue}; ${COOKIE_PATH}; HttpOnly; ${COOKIE_SAME_SITE}`,
  );
  headers.append(
    "Set-Cookie",
    `${CSRF_COOKIE}=${csrfToken}; ${COOKIE_PATH}; ${COOKIE_SAME_SITE}`,
  );

  return HttpResponse.json(
    {
      user,
      requiresOnboarding,
    },
    {
      headers,
    },
  );
};

const createLogoutHeaders = () => {
  const headers = new Headers();

  headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=; ${COOKIE_PATH}; Max-Age=0; ${COOKIE_SAME_SITE}`,
  );
  headers.append(
    "Set-Cookie",
    `${REFRESH_TOKEN_COOKIE}=; ${COOKIE_PATH}; Max-Age=0; ${COOKIE_SAME_SITE}`,
  );
  headers.append(
    "Set-Cookie",
    `${CSRF_COOKIE}=; ${COOKIE_PATH}; Max-Age=0; ${COOKIE_SAME_SITE}`,
  );

  return headers;
};

const createRefreshHeaders = (username: string) => {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${CSRF_COOKIE}=csrf_${encodeURIComponent(username)}; ${COOKIE_PATH}; ${COOKIE_SAME_SITE}`,
  );
  return headers;
};

const loginSuccessResponse = (user: AuthUser, requiresOnboarding = false) => {
  setMockSessionUser(user);
  return createLoginResponse(user, requiresOnboarding);
};

const getCookieValue = (cookieHeader: string, key: string) => {
  const pair = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  if (!pair) return null;
  return pair.slice(key.length + 1);
};

const buildLoginScenario = (username: string): LoginScenario => {
  if (username === "admin") {
    return {
      user: createMockAuthUser({
        username: "admin",
        fullName: "Administrador",
        landingRoute: "/admin/roles",
        roles: ["Admin"],
        avatarUrl: "https://i.pravatar.cc/96?img=8",
        permissions: ["*"],
      }),
    };
  }

  if (username === "admin_usuarios_readonly") {
    return {
      user: createMockAuthUser({
        username: "admin_usuarios_readonly",
        fullName: "Admin Usuarios Lectura",
        landingRoute: "/admin/usuarios",
        roles: ["Admin Usuarios"],
        avatarUrl: "https://i.pravatar.cc/96?img=9",
        permissions: [
          "admin:gestion:usuarios:read",
          "admin:gestion:roles:read",
        ],
      }),
    };
  }

  if (username === "admin_roles_readonly") {
    return {
      user: createMockAuthUser({
        username: "admin_roles_readonly",
        fullName: "Admin Roles Lectura",
        landingRoute: "/admin/roles",
        roles: ["Admin Roles"],
        avatarUrl: "https://i.pravatar.cc/96?img=10",
        permissions: ["admin:gestion:roles:read"],
      }),
    };
  }

  if (username === "admin_roles_manager") {
    return {
      user: createMockAuthUser({
        username: "admin_roles_manager",
        fullName: "Admin Gestor Roles",
        landingRoute: "/admin/roles",
        roles: ["Admin Roles"],
        avatarUrl: "https://i.pravatar.cc/96?img=11",
        permissions: [
          "admin:gestion:roles:read",
          "admin:gestion:roles:create",
          "admin:gestion:roles:update",
          "admin:gestion:roles:delete",
          "admin:gestion:permisos:read",
        ],
      }),
    };
  }

  if (username === "clinico" || username === "medico") {
    return {
      user: createMockAuthUser({
        username: "clinico",
        fullName: "Dra. Rivera",
        landingRoute: "/clinico/consultas",
        roles: ["Clinico"],
        avatarUrl: "https://i.pravatar.cc/96?img=15",
        permissions: [
          "clinico:consultas:read",
          "clinico:consultas:create",
          "clinico:expedientes:read",
          "clinico:somatometria:read",
          "admin:catalogos:centros_atencion:read",
        ],
      }),
    };
  }

  if (username === "recepcion") {
    return {
      user: createMockAuthUser({
        username: "recepcion",
        fullName: "Recepcion Central",
        landingRoute: "/recepcion/fichas",
        roles: ["Recepcion"],
        avatarUrl: "https://i.pravatar.cc/96?img=21",
        permissions: [
          "recepcion:fichas:medicina_general:create",
          "recepcion:fichas:especialidad:create",
          "recepcion:fichas:urgencias:create",
          "recepcion:incapacidad:create",
          "clinico:expedientes:read",
        ],
      }),
    };
  }

  if (username === "farmacia") {
    return {
      user: createMockAuthUser({
        username: "farmacia",
        fullName: "Farmacia Principal",
        landingRoute: "/farmacia/recetas",
        roles: ["Farmacia"],
        avatarUrl: "https://i.pravatar.cc/96?img=31",
        permissions: [
          "farmacia:recetas:dispensar",
          "farmacia:inventario:update",
        ],
      }),
    };
  }

  if (username === "urgencias") {
    return {
      user: createMockAuthUser({
        username: "urgencias",
        fullName: "Medico Urgencias",
        landingRoute: "/urgencias/triage",
        roles: ["Urgencias"],
        avatarUrl: "https://i.pravatar.cc/96?img=45",
        permissions: ["urgencias:triage:read"],
      }),
    };
  }

  if (username === "hospital") {
    return {
      user: createMockAuthUser({
        username: "hospital",
        fullName: "Coord. Hospitalaria",
        roles: ["HOSPITAL"],
        permissions: [
          "hospital:coordinacion",
          "hospital:admision",
          "hospital:camas",
        ],
      }),
    };
  }

  if (username === "newuser") {
    return {
      user: createMockAuthUser({
        username: "newuser",
        mustChangePassword: true,
        requiresOnboarding: true,
      }),
      requiresOnboarding: true,
    };
  }

  return {
    user: createMockAuthUser({ username }),
  };
};

const applyTestUserOverride = (
  username: string,
  scenario: LoginScenario,
): LoginScenario => {
  const override = testUserOverrides.get(username);
  if (!override) return scenario;

  return {
    user: {
      ...scenario.user,
      ...(override.mustChangePassword !== undefined
        ? { mustChangePassword: override.mustChangePassword }
        : {}),
      ...(override.requiresOnboarding !== undefined
        ? { requiresOnboarding: override.requiresOnboarding }
        : {}),
    },
    requiresOnboarding:
      override.requiresOnboarding ?? scenario.requiresOnboarding,
  };
};

const resolveSessionUser = (
  request: Request,
  cookies?: Record<string, string>,
) => {
  const currentSessionUser = getMockSessionUser();
  if (currentSessionUser) return currentSessionUser;

  const accessTokenFromStore = cookies?.access_token_cookie;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken =
    accessTokenFromStore ?? getCookieValue(cookieHeader, "access_token_cookie");

  if (!accessToken) return null;

  const username = decodeURIComponent(accessToken);
  const { user } = applyTestUserOverride(
    username,
    buildLoginScenario(username),
  );
  setMockSessionUser(user);
  return user;
};

export const authHandlers = [
  // ============================================================
  // SESIÓN Y LOGIN
  // ============================================================

  http.post(getApiUrl("auth/login"), async ({ request }) => {
    await delay(MOCK_DELAY.auth);

    const body = (await request.json()) as {
      username: string;
      password: string;
    };
    const { username, password } = body;

    // --- ESCENARIOS DE ERROR "MÁGICOS" ---

    // 1. Credenciales Inválidas
    if (username === "error" || password === "wrong") {
      return HttpResponse.json(
        {
          code: "INVALID_CREDENTIALS",
          message: "Usuario o contraseña incorrectos",
        },
        { status: 401 },
      );
    }

    // 2. Usuario Bloqueado
    if (username === "locked") {
      return HttpResponse.json(
        {
          code: "ACCOUNT_LOCKED",
          message:
            "Tu cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos. Intenta en 15 minutos.",
        },
        { status: 423 },
      );
    }

    // 3. Usuario Inactivo
    if (username === "inactive") {
      return HttpResponse.json(
        {
          code: "USER_INACTIVE",
          message: "Tu cuenta ha sido desactivada por un administrador.",
        },
        { status: 403 },
      );
    }

    // 4. Cuenta Expirada (Nuevo)
    if (username === "expired") {
      return HttpResponse.json(
        {
          code: "ACCOUNT_EXPIRED",
          message: "Tu cuenta ha expirado. Contacta a soporte.",
        },
        { status: 401 },
      );
    }

    // 5. Mantenimiento (Nuevo)
    if (username === "maintenance") {
      return HttpResponse.json(
        {
          code: "SERVICE_UNAVAILABLE",
          message: "El sistema está en mantenimiento. Vuelve en unos minutos.",
        },
        { status: 503 },
      );
    }

    // 6. Error Interno
    if (username === "broken") {
      return HttpResponse.json(
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error interno del servidor. Intente más tarde.",
        },
        { status: 500 },
      );
    }

    const scenario = applyTestUserOverride(
      username,
      buildLoginScenario(username),
    );
    return loginSuccessResponse(
      scenario.user,
      scenario.requiresOnboarding ?? false,
    );
  }),

  http.post(getApiUrl("auth/logout"), async () => {
    await delay(MOCK_DELAY.short);
    clearMockSessionUser();

    return HttpResponse.json(
      {
        success: true,
        message: "Sesion cerrada correctamente",
      },
      {
        headers: createLogoutHeaders(),
      },
    );
  }),

  http.get(getApiUrl("auth/me"), async ({ request, cookies }) => {
    await delay(MOCK_DELAY.short);
    const user = resolveSessionUser(request, cookies);

    if (!user) {
      return HttpResponse.json(
        {
          code: "SESSION_EXPIRED",
          message: "La sesion no es valida o ha expirado.",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(user);
  }),

  http.post(getApiUrl("auth/refresh"), async ({ request, cookies }) => {
    await delay(MOCK_DELAY.short);
    const user = resolveSessionUser(request, cookies);

    if (!user) {
      return HttpResponse.json(
        {
          code: "REFRESH_TOKEN_EXPIRED",
          message: "No hay refresh token valido.",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      { success: true, message: "Sesion renovada" },
      {
        headers: createRefreshHeaders(user.username),
      },
    );
  }),

  http.get(getApiUrl("auth/verify"), async ({ request, cookies }) => {
    const user = resolveSessionUser(request, cookies);

    if (!user) {
      return HttpResponse.json(
        {
          code: "SESSION_EXPIRED",
          message: "La sesion no es valida o ha expirado.",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({ valid: true });
  }),

  // ============================================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ============================================================

  http.post(getApiUrl("auth/request-reset-code"), async ({ request }) => {
    await delay(MOCK_DELAY.long);
    const body = (await request.json()) as { email: string };

    if (
      body.email === "error@fail.com" ||
      body.email.toLowerCase().includes("noexiste")
    ) {
      return HttpResponse.json(
        {
          code: "USER_NOT_FOUND",
          message: "No encontramos un usuario con ese correo.",
        },
        { status: 404 },
      );
    }

    resetCodeStore.set(body.email.toLowerCase(), "123456");

    return HttpResponse.json({
      success: true,
      message: "Si el correo existe, se ha enviado un codigo de verificacion.",
    });
  }),

  http.post(getApiUrl("auth/verify-reset-code"), async ({ request }) => {
    await delay(MOCK_DELAY.long);
    const body = (await request.json()) as {
      email: string;
      code: string | number;
    };

    // Convertir a string para asegurar comparación correcta
    const code = String(body.code);
    const expectedCode =
      resetCodeStore.get(body.email.toLowerCase()) ?? "123456";

    if (code === expectedCode) {
      return HttpResponse.json({
        valid: true,
      });
    }

    if (code === "000000") {
      return HttpResponse.json(
        {
          code: "CODE_EXPIRED",
          message: "El código ha expirado. Solicita uno nuevo.",
        },
        { status: 400 },
      );
    }

    // Nuevo: Exceso de intentos
    if (code === "999999") {
      return HttpResponse.json(
        {
          code: "CODE_EXPIRED",
          message: "Código invalidado por demasiados intentos.",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        code: "INVALID_CODE",
        message: "Código incorrecto. Verifica los 6 dígitos.",
      },
      { status: 400 },
    );
  }),

  http.post(getApiUrl("auth/reset-password"), async ({ request }) => {
    await delay(MOCK_DELAY.long);
    const body = (await request.json()) as { newPassword: string };

    // Simulación de Token Expirado
    if (body.newPassword === "ExpiredToken1!") {
      return HttpResponse.json(
        {
          code: "TOKEN_EXPIRED",
          message: "Tu sesión ha expirado. Solicita un nuevo código.",
        },
        { status: 401 },
      );
    }

    // Simulación de Token Inválido
    if (body.newPassword === "TokenInvalid1!") {
      return HttpResponse.json(
        {
          code: "TOKEN_INVALID",
          message: "El token de restablecimiento es inválido o ha expirado.",
        },
        { status: 401 },
      );
    }

    // Simulación de Error Interno
    if (body.newPassword === "InvalidToken1!") {
      return HttpResponse.json(
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "No se pudo restablecer la contraseña. Intente nuevamente.",
        },
        { status: 500 },
      );
    }

    // Validación Robusta de Contraseña
    if (!isPasswordStrong(body.newPassword)) {
      return HttpResponse.json(
        {
          code: "PASSWORD_TOO_WEAK",
          message:
            "La contraseña no cumple con los requisitos de seguridad (mín 8 caracteres, mayúscula, número y símbolo).",
        },
        { status: 400 },
      );
    }

    const user = createMockAuthUser();
    setMockSessionUser(user);

    return createLoginResponse(user, false);
  }),

  // ============================================================
  // ONBOARDING
  // ============================================================

  http.post(getApiUrl("auth/complete-onboarding"), async ({ request }) => {
    await delay(MOCK_DELAY.long);
    const body = (await request.json()) as {
      newPassword: string;
      termsAccepted: boolean;
    };

    // Validar Términos
    if (body.termsAccepted === false) {
      return HttpResponse.json(
        {
          code: "TERMS_NOT_ACCEPTED",
          message: "Debes aceptar los términos y condiciones.",
        },
        { status: 400 },
      );
    }

    // Simulación de Token Expirado (Onboarding)
    if (body.newPassword === "ExpiredToken1!") {
      return HttpResponse.json(
        {
          code: "TOKEN_EXPIRED",
          message: "Tu sesión ha expirado. Inicia sesión nuevamente.",
        },
        { status: 401 },
      );
    }

    // Simulación de Fallo Genérico en Onboarding
    // Usamos la password mágica "InvalidToken1!" para simular que algo falló en el backend
    if (body.newPassword === "InvalidToken1!") {
      return HttpResponse.json(
        {
          code: "ONBOARDING_FAILED",
          message: "No se pudo completar el registro. Intente nuevamente.",
        },
        { status: 500 },
      );
    }

    // Validación Robusta de Contraseña
    if (!isPasswordStrong(body.newPassword)) {
      return HttpResponse.json(
        {
          code: "PASSWORD_TOO_WEAK",
          message: "La contraseña no cumple con los requisitos de seguridad.",
        },
        { status: 400 },
      );
    }

    const user = createMockAuthUser({
      mustChangePassword: false,
    });
    setMockSessionUser(user);

    return createLoginResponse(user, false);
  }),

  // ============================================================
  // TEST HELPERS
  // ============================================================

  http.post(getApiUrl("auth/test-reset-state"), async () => {
    resetRolesMockState();
    resetUsersMockState();
    resetMockSessionUser();
    testUserOverrides.clear();
    resetCodeStore.clear();

    return HttpResponse.json({ success: true });
  }),

  http.post(getApiUrl("auth/test-reset-user"), async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      requiresOnboarding?: boolean;
      mustChangePassword?: boolean;
    };

    testUserOverrides.set(body.username, {
      requiresOnboarding: body.requiresOnboarding,
      mustChangePassword: body.mustChangePassword,
    });

    return HttpResponse.json({ success: true });
  }),

  http.get(getApiUrl("auth/test-get-otp"), async ({ request }) => {
    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.toLowerCase() ?? "";
    const code = resetCodeStore.get(email) ?? "123456";

    return HttpResponse.json({ code });
  }),
];
