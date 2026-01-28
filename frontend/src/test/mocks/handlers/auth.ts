import { http, HttpResponse, delay } from "msw";
import type { AuthUser } from "@/api/types/auth.types";
import { createMockAuthUser } from "../../factories/users";
import { getApiUrl } from "../urls";

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
  return HttpResponse.json(
    {
      user,
      requiresOnboarding,
    },
    {
      headers: {
        "Set-Cookie":
          "access_token_cookie=mock_access_token; Path=/; HttpOnly, refresh_token_cookie=mock_refresh_token; Path=/; HttpOnly",
      },
    },
  );
};

export const authHandlers = [
  // ============================================================
  // SESIÓN Y LOGIN
  // ============================================================

  http.post(getApiUrl("auth/login"), async ({ request }) => {
    await delay(400);

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
          code: "USER_LOCKED",
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
          code: "SERVER_ERROR",
          message: "Error interno del servidor. Intente más tarde.",
        },
        { status: 500 },
      );
    }

    // --- ESCENARIOS DE ROLES (PARA TESTING DE NAVEGACIÓN) ---

    // A. Administrador
    if (username === "admin") {
      const user = createMockAuthUser({
        username: "admin",
        fullName: "Administrador",
        landingRoute: "/admin/panel",
        roles: ["ADMIN"],
        permissions: ["*"], // Acceso total
      });
      return createLoginResponse(user);
    }

    // B. Médico (MODIFICADO PARA PRUEBA DE SIDEBAR)
    if (username === "medico") {
      const user = createMockAuthUser({
        username: "medico",
        fullName: "Dr. House",
        landingRoute: "/clinico/consultas",
        roles: ["MEDICOS"],
        permissions: [
          "clinico:consultas:read",
          "clinico:consultas:create",
          "clinico:expedientes:read",
          "clinico:somatometria:read",
          "admin:catalogos:centros_atencion:read",
        ],
      });
      return createLoginResponse(user);
    }

    // C. Recepción
    if (username === "recepcion") {
      const user = createMockAuthUser({
        username: "recepcion",
        fullName: "Recepcion Central",
        landingRoute: "/recepcion/fichas",
        roles: ["RECEPCION"],
        permissions: [
          "recepcion:fichas:medicina_general:create",
          "recepcion:fichas:especialidad:create",
          "recepcion:fichas:urgencias:create",
          "recepcion:incapacidad:create",
          "clinico:expedientes:read",
        ],
      });
      return createLoginResponse(user);
    }

    // D. Farmacia
    if (username === "farmacia") {
      const user = createMockAuthUser({
        username: "farmacia",
        fullName: "Farmacia Principal",
        landingRoute: "/farmacia/recetas",
        roles: ["FARMACIA"],
        permissions: [
          "farmacia:recetas:dispensar",
          "farmacia:inventario:update",
        ],
      });
      return createLoginResponse(user);
    }

    // E. Urgencias
    if (username === "urgencias") {
      const user = createMockAuthUser({
        username: "urgencias",
        fullName: "Medico Urgencias",
        landingRoute: "/urgencias/triage",
        roles: ["URGENCIAS"],
        permissions: ["urgencias:triage:read"],
      });
      return createLoginResponse(user);
    }

    // F. Hospital
    if (username === "hospital") {
      const user = createMockAuthUser({
        username: "hospital",
        fullName: "Coord. Hospitalaria",
        roles: ["HOSPITAL"],
        permissions: [
          "hospital:coordinacion",
          "hospital:admision",
          "hospital:camas",
        ],
      });
      return createLoginResponse(user);
    }

    // --- ESCENARIOS DE ÉXITO GENÉRICOS ---

    // 7. Usuario Nuevo (Requiere Onboarding)
    if (username === "newuser") {
      const user = createMockAuthUser({
        username: "newuser",
        mustChangePassword: true,
      });
      return createLoginResponse(user, true);
    }

    // 8. Login Exitoso (Default)
    const user = createMockAuthUser({ username });
    return createLoginResponse(user);
  }),

  http.post(getApiUrl("auth/logout"), async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      message: "Sesion cerrada correctamente",
    });
  }),

  http.get(getApiUrl("auth/me"), async () => {
    const user = createMockAuthUser();
    return HttpResponse.json(user);
  }),

  http.post(getApiUrl("auth/refresh"), async () => {
    await delay(200);
    return HttpResponse.json({ success: true, message: "Sesion renovada" });
  }),

  http.get(getApiUrl("auth/verify"), async () => {
    return HttpResponse.json({ valid: true });
  }),

  // ============================================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ============================================================

  http.post(getApiUrl("auth/request-reset-code"), async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { email: string };

    if (body.email === "error@fail.com") {
      return HttpResponse.json(
        {
          code: "USER_NOT_FOUND",
          message: "No encontramos un usuario con ese correo.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: "Si el correo existe, se ha enviado un codigo de verificacion.",
    });
  }),

  http.post(getApiUrl("auth/verify-reset-code"), async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { code: string | number };

    // Convertir a string para asegurar comparación correcta
    const code = String(body.code);

    if (code === "123456") {
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
          code: "TOO_MANY_ATTEMPTS",
          message: "Has excedido el número de intentos. Intenta más tarde.",
        },
        { status: 429 },
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
    await delay(800);
    const body = (await request.json()) as { newPassword: string };

    // Simulación de Token Inválido
    if (body.newPassword === "InvalidToken1!") {
      return HttpResponse.json(
        {
          code: "INVALID_TOKEN",
          message: "El token de restablecimiento es inválido o ha expirado.",
        },
        { status: 401 },
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

    return HttpResponse.json({
      user,
      requiresOnboarding: false,
    });
  }),

  // ============================================================
  // ONBOARDING
  // ============================================================

  http.post(getApiUrl("auth/complete-onboarding"), async ({ request }) => {
    await delay(800);
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

    // Simulación de Fallo Genérico en Onboarding (Nuevo)
    // Usamos la misma password mágica "InvalidToken1!" para simular que algo falló en el backend
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

    return HttpResponse.json({
      user,
      requiresOnboarding: false,
    });
  }),
];
