import { http, HttpResponse, delay } from "msw";
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
const createLoginResponse = (user: any, requiresOnboarding = false) => {
  return HttpResponse.json({
    user,
    expires_in: 3600,
    token_type: "Bearer",
    requires_onboarding: requiresOnboarding
  }, {
    headers: {
      'Set-Cookie': 'access_token_cookie=mock_access_token; Path=/; HttpOnly, refresh_token_cookie=mock_refresh_token; Path=/; HttpOnly'
    }
  });
};

export const authHandlers = [
  // ============================================================
  // SESIÓN Y LOGIN
  // ============================================================

  http.post(getApiUrl("auth/login"), async ({ request }) => {
    await delay(400); 
    
    const body = await request.json() as { usuario: string; clave: string };
    const { usuario, clave } = body;

    // --- ESCENARIOS DE ERROR "MÁGICOS" ---
    
    // 1. Credenciales Inválidas
    if (usuario === "error" || clave === "wrong") {
      return HttpResponse.json({
        code: "INVALID_CREDENTIALS",
        message: "Usuario o contraseña incorrectos"
      }, { status: 401 });
    }

    // 2. Usuario Bloqueado
    if (usuario === "locked") {
      return HttpResponse.json({
        code: "USER_LOCKED",
        message: "Tu cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos. Intenta en 15 minutos."
      }, { status: 423 });
    }

    // 3. Usuario Inactivo
    if (usuario === "inactive") {
      return HttpResponse.json({
        code: "USER_INACTIVE",
        message: "Tu cuenta ha sido desactivada por un administrador."
      }, { status: 403 });
    }

    // 4. Cuenta Expirada (Nuevo)
    if (usuario === "expired") {
      return HttpResponse.json({
        code: "ACCOUNT_EXPIRED",
        message: "Tu cuenta ha expirado. Contacta a soporte."
      }, { status: 401 });
    }

    // 5. Mantenimiento (Nuevo)
    if (usuario === "maintenance") {
      return HttpResponse.json({
        code: "SERVICE_UNAVAILABLE",
        message: "El sistema está en mantenimiento. Vuelve en unos minutos."
      }, { status: 503 });
    }

    // 6. Error Interno
    if (usuario === "broken") {
      return HttpResponse.json({
        code: "SERVER_ERROR",
        message: "Error interno del servidor. Intente más tarde."
      }, { status: 500 });
    }

    // --- ESCENARIOS DE ROLES (PARA TESTING DE NAVEGACIÓN) ---

    // A. Administrador
    if (usuario === "admin") {
      const user = createMockAuthUser({
        usuario: "admin",
        nombre: "Administrador",
        roles: ["ADMINISTRADOR"],
        permissions: ["*"], // Acceso total
        landing_route: "/admin",
        is_admin: true
      });
      return createLoginResponse(user);
    }

    // B. Médico (MODIFICADO PARA PRUEBA DE SIDEBAR)
    if (usuario === "medico") {
      const user = createMockAuthUser({
        usuario: "medico",
        nombre: "Dr. House",
        roles: ["MEDICOS"],
        permissions: [
            "consultas:read", "consultas:create", 
            // "expedientes:read", "expedientes:update", // REMOVIDO para prueba
            "recetas:create", "laboratorio:create",
            "catalogos:update" // AGREGADO para prueba (debería ver Admin > Catálogos)
        ],
        landing_route: "/consultas",
        is_admin: false
      });
      return createLoginResponse(user);
    }

    // C. Recepción
    if (usuario === "recepcion") {
      const user = createMockAuthUser({
        usuario: "recepcion",
        nombre: "Recepción Central",
        roles: ["RECEPCION"],
        permissions: [
            "recepcion:registrar_paciente", 
            "recepcion:agendar_cita",
            "expedientes:read" // Solo lectura
        ],
        landing_route: "/recepcion",
        is_admin: false
      });
      return createLoginResponse(user);
    }

    // D. Farmacia
    if (usuario === "farmacia") {
      const user = createMockAuthUser({
        usuario: "farmacia",
        nombre: "Farmacia Principal",
        roles: ["FARMACIA"],
        permissions: [
            "farmacia:dispensar", 
            "farmacia:gestionar_inventario",
            "recetas:read"
        ],
        landing_route: "/farmacia",
        is_admin: false
      });
      return createLoginResponse(user);
    }

    // E. Urgencias
    if (usuario === "urgencias") {
      const user = createMockAuthUser({
        usuario: "urgencias",
        nombre: "Médico Urgencias",
        roles: ["URGENCIAS"],
        permissions: [
            "urgencias:atender", 
            "urgencias:triage",
            "expedientes:read"
        ],
        landing_route: "/urgencias",
        is_admin: false
      });
      return createLoginResponse(user);
    }

    // F. Hospital
    if (usuario === "hospital") {
      const user = createMockAuthUser({
        usuario: "hospital",
        nombre: "Coord. Hospitalaria",
        roles: ["HOSPITAL"],
        permissions: [
            "hospital:coordinacion", 
            "hospital:admision",
            "hospital:camas"
        ],
        landing_route: "/hospital",
        is_admin: false
      });
      return createLoginResponse(user);
    }

    // --- ESCENARIOS DE ÉXITO GENÉRICOS ---

    // 7. Usuario Nuevo (Requiere Onboarding)
    if (usuario === "newuser") {
      const user = createMockAuthUser({ 
        usuario: "newuser",
        must_change_password: true 
      });
      return createLoginResponse(user, true);
    }

    // 8. Login Exitoso (Default)
    const user = createMockAuthUser({ usuario }); 
    return createLoginResponse(user);
  }),

  http.post(getApiUrl("auth/logout"), async () => {
    await delay(200);
    return HttpResponse.json({ message: "Sesión cerrada correctamente" });
  }),

  http.get(getApiUrl("auth/me"), async () => {
    const user = createMockAuthUser();
    return HttpResponse.json(user);
  }),

  http.post(getApiUrl("auth/refresh"), async () => {
    await delay(200);
    return HttpResponse.json({
      access_token: "new_mock_access_token_" + Date.now(),
      token_type: "Bearer",
      expires_in: 3600
    });
  }),

  http.get(getApiUrl("auth/verify"), async () => {
    return HttpResponse.json({ valid: true });
  }),

  // ============================================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ============================================================

  http.post(getApiUrl("auth/request-reset-code"), async ({ request }) => {
    await delay(500);
    const body = await request.json() as { email: string };

    if (body.email === "error@fail.com") {
        return HttpResponse.json({
            code: "USER_NOT_FOUND",
            message: "No encontramos un usuario con ese correo."
        }, { status: 404 });
    }

    return HttpResponse.json({ 
      message: "Si el correo existe, se ha enviado un código de verificación." 
    });
  }),

  http.post(getApiUrl("auth/verify-reset-code"), async ({ request }) => {
    await delay(500);
    const body = await request.json() as { code: string | number };
    
    // Convertir a string para asegurar comparación correcta
    const code = String(body.code);
    
    console.log(`[Mock Auth] Verificando OTP: ${code}`); // Para depuración en consola

    if (code === "123456") {
      return HttpResponse.json({ 
        valid: true,
        reset_token: "temp_reset_token_123" 
      });
    }

    if (code === "000000") {
        return HttpResponse.json({
            code: "CODE_EXPIRED",
            message: "El código ha expirado. Solicita uno nuevo."
        }, { status: 400 });
    }

    // Nuevo: Exceso de intentos
    if (code === "999999") {
        return HttpResponse.json({
            code: "TOO_MANY_ATTEMPTS",
            message: "Has excedido el número de intentos. Intenta más tarde."
        }, { status: 429 });
    }

    return HttpResponse.json({ 
      code: "INVALID_CODE",
      message: "Código incorrecto. Verifica los 6 dígitos." 
    }, { status: 400 });
  }),

  http.post(getApiUrl("auth/reset-password"), async ({ request }) => {
    await delay(800);
    const body = await request.json() as { new_password: string };

    // Simulación de Token Inválido
    if (body.new_password === "InvalidToken1!") {
       return HttpResponse.json({
           code: "INVALID_TOKEN",
           message: "El token de restablecimiento es inválido o ha expirado."
       }, { status: 401 });
    }

    // Validación Robusta de Contraseña
    if (!isPasswordStrong(body.new_password)) {
        return HttpResponse.json({
            code: "PASSWORD_TOO_WEAK",
            message: "La contraseña no cumple con los requisitos de seguridad (mín 8 caracteres, mayúscula, número y símbolo)."
        }, { status: 400 });
    }

    const user = createMockAuthUser();
    
    return HttpResponse.json({
      message: "Contraseña actualizada correctamente",
      user,
      expires_in: 3600,
      token_type: "Bearer"
    });
  }),

  // ============================================================
  // ONBOARDING
  // ============================================================

  http.post(getApiUrl("auth/complete-onboarding"), async ({ request }) => {
    await delay(800);
    const body = await request.json() as { new_password: string; terms_accepted: boolean };

    // Validar Términos
    if (body.terms_accepted === false) {
        return HttpResponse.json({
            code: "TERMS_NOT_ACCEPTED",
            message: "Debes aceptar los términos y condiciones."
        }, { status: 400 });
    }

    // Simulación de Fallo Genérico en Onboarding (Nuevo)
    // Usamos la misma password mágica "InvalidToken1!" para simular que algo falló en el backend
    if (body.new_password === "InvalidToken1!") {
        return HttpResponse.json({
            code: "ONBOARDING_FAILED",
            message: "No se pudo completar el registro. Intente nuevamente."
        }, { status: 500 });
    }

    // Validación Robusta de Contraseña
    if (!isPasswordStrong(body.new_password)) {
        return HttpResponse.json({
            code: "PASSWORD_TOO_WEAK",
            message: "La contraseña no cumple con los requisitos de seguridad."
        }, { status: 400 });
    }
    
    const user = createMockAuthUser({ 
      must_change_password: false 
    });

    return HttpResponse.json({
      success: true,
      message: "Onboarding completado",
      user,
      expires_in: 3600,
      token_type: "Bearer"
    });
  }),
];
