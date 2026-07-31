/**
 * Auth store del portal — token Bearer en sessionStorage.
 * ============================================================
 *
 * DECISIÓN: sessionStorage, no localStorage.
 *
 * Por qué: el backend del portal (`PortalSesion` /
 * `apps.portal_citas.services.token_service`) NO implementa refresh token
 * — la sesión emitida en `verificar-codigo` dura ~20-25 minutos
 * (`PORTAL_SESSION_LIFETIME`, ver
 * backend/apps/portal_citas/services/token_service.py) y punto. Es un
 * flujo transaccional corto (login -> elegir horario -> reservar), no una
 * sesión de app de uso prolongado.
 *
 * Tradeoff aceptado: sessionStorage se borra al cerrar la pestaña/ventana
 * (a diferencia de localStorage, que persiste indefinidamente). Eso
 * significa que si el usuario cierra la pestaña a la mitad del trámite,
 * tiene que volver a loguearse — aceptable dado que la sesión de todos
 * modos expira sola en minutos y no hay nada que "recordar" entre
 * visitas (no hay refresh token que la sobreviva). A cambio, se gana no
 * dejar un Bearer token de un paciente vivo indefinidamente en el disco
 * de una compu compartida (biblioteca, kiosco de la clínica, etc.), que
 * es el riesgo real de localStorage para este caso de uso.
 *
 * Este módulo es el ÚNICO lugar que toca sessionStorage para el token —
 * todo lo demás (cliente HTTP, guard de rutas, páginas) pasa por estas
 * funciones para que el punto de acceso quede centralizado.
 */

const TOKEN_KEY = "portal_citas.access_token";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
