import { useNavigate } from "react-router-dom";

import {
  clearReservaResultado,
  getReservaResultado,
} from "@/api/reservaResultadoStore";
import Button from "@/components/Button";

const FORMATO_FECHA_HORA = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Pantalla de éxito tras `POST /portal/citas` (Fase F3). Lee el resultado
 * desde `@/api/reservaResultadoStore.ts` (sessionStorage) en vez de
 * `location.state` — ver la justificación completa en ese módulo (sobrevive
 * un refresh accidental de esta misma pantalla).
 *
 * Si no hay resultado guardado (alguien entra directo a la URL sin haber
 * confirmado una reserva), redirige a `/` — no hay nada que mostrar.
 */
export default function ReservaExitosaPage() {
  const navigate = useNavigate();
  const resultado = getReservaResultado();

  if (!resultado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app p-6 text-center">
        <h1 className="text-2xl font-display font-semibold text-txt-body">
          No hay ninguna reserva reciente
        </h1>
        <p className="max-w-md text-txt-muted">
          Si acabás de confirmar una cita, revisá el correo que te enviamos.
          Si no, volvé al inicio para agendar una nueva.
        </p>
        <Button type="button" onClick={() => navigate("/", { replace: true })}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  const fechaHoraLegible = FORMATO_FECHA_HORA.format(
    new Date(resultado.fechaHora)
  );

  const handleVolver = () => {
    clearReservaResultado();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-app p-6">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-line-hairline bg-paper p-6 text-center shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-status-stable/15 text-2xl text-status-stable">
            ✓
          </span>
          <h1 className="text-xl font-display font-semibold text-txt-body">
            Cita confirmada
          </h1>
        </div>

        <div className="flex flex-col gap-1 rounded-md bg-subtle p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-txt-muted">
            Folio
          </span>
          <span className="text-2xl font-bold tracking-wide text-txt-body">
            {resultado.folio}
          </span>
        </div>

        <dl className="flex flex-col gap-2 text-left text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-txt-muted">Fecha y hora</dt>
            <dd className="text-right font-medium capitalize text-txt-body">
              {fechaHoraLegible}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-txt-muted">Consultorio</dt>
            <dd className="text-right font-medium text-txt-body">
              {resultado.consultorioNombre ?? "Sin asignar"}
            </dd>
          </div>
        </dl>

        <p className="text-sm text-txt-muted">
          Te enviamos un comprobante con código QR a tu correo — llevalo el
          día de tu cita.
        </p>

        <Button type="button" onClick={handleVolver}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
