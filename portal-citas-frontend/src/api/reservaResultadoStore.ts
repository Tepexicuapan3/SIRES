/**
 * Resultado de la última reserva confirmada — puente entre
 * `ConfirmarReservaPage` y `ReservaExitosaPage`.
 * ============================================================
 *
 * DECISIÓN: sessionStorage, mismo patrón que `@/api/reservaDraftStore.ts`
 * (que a su vez sigue el criterio de `@/api/authStore.ts`) — NO
 * `navigate("/reservar/exito", { state: {...} })` de React Router.
 *
 * Por qué NO `location.state`: sobrevive la navegación normal, pero un
 * refresh de `/reservar/exito` (que el paciente puede hacer sin querer
 * justo después de confirmar, para releer el folio con calma) lo pierde —
 * `location.state` vive en memoria del historial de la sesión de navegación,
 * no se re-hidrata desde el servidor porque esta es una SPA. El folio es el
 * dato más importante que ve el paciente en todo el flujo (lo necesita para
 * el día de la cita); perderlo en un refresh accidental sería un mal
 * momento para fallar. sessionStorage resuelve eso al mismo costo que ya
 * paga el draft.
 *
 * A diferencia de `reservaDraftStore`, este valor NO se limpia
 * automáticamente al leerlo (`getReservaResultado` es idempotente) —
 * se limpia recién cuando el paciente navega explícitamente fuera de la
 * pantalla de éxito (botón "Volver al inicio"), para que un refresh
 * intermedio siga mostrando el mismo comprobante.
 */

export interface ReservaResultado {
  folio: string;
  /** ISO 8601, tal como lo devuelve `POST /portal/citas`. */
  fechaHora: string;
  consultorioNombre: string | null;
  medicoNombre: string;
  servicioTipo: "especialidad" | "medicina_general";
}

const RESULTADO_KEY = "portal_citas.reserva_resultado";

export function getReservaResultado(): ReservaResultado | null {
  const raw = sessionStorage.getItem(RESULTADO_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ReservaResultado;
  } catch {
    sessionStorage.removeItem(RESULTADO_KEY);
    return null;
  }
}

export function setReservaResultado(resultado: ReservaResultado): void {
  sessionStorage.setItem(RESULTADO_KEY, JSON.stringify(resultado));
}

export function clearReservaResultado(): void {
  sessionStorage.removeItem(RESULTADO_KEY);
}
