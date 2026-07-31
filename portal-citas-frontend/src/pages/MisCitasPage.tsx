import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  cancelarCita,
  listarCitas,
  type CitaPortal,
  type EstatusCitaPortal,
} from "@/api/citas.api";
import { ApiError } from "@/api/client";
import { clearToken } from "@/api/authStore";
import Button from "@/components/Button";
import ErrorAlert from "@/components/ErrorAlert";

const FORMATO_FECHA_HORA = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Mismo criterio que HomePage.tsx: ApiError trae el mensaje ya listo para mostrar. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

const ESTATUS_ESTILO: Record<EstatusCitaPortal, { etiqueta: string; className: string }> = {
  agendada: { etiqueta: "Agendada", className: "bg-blue-100 text-blue-800" },
  confirmada: { etiqueta: "Confirmada", className: "bg-emerald-100 text-emerald-800" },
  atendida: { etiqueta: "Atendida", className: "bg-slate-200 text-slate-700" },
  cancelada: { etiqueta: "Cancelada", className: "bg-red-100 text-red-700" },
  no_asistio: { etiqueta: "No asistió", className: "bg-amber-100 text-amber-800" },
};

function EstatusBadge({ estatus }: { estatus: EstatusCitaPortal }) {
  const info = ESTATUS_ESTILO[estatus];
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.className}`}
    >
      {info.etiqueta}
    </span>
  );
}

/**
 * "Mis citas" (Fase F4). Lista `GET /portal/citas` (Fase 8 del backend,
 * `@/api/citas.api.ts#listarCitas`) y permite cancelar cada cita cuyo
 * `cancelable` venga en `true` vía `PATCH /portal/citas/{folio}/cancelar`
 * (`@/api/citas.api.ts#cancelarCita`, Fase 6 del backend).
 *
 * `cancelable` se calcula en el backend (misma regla que
 * `cancelar_cita_usecase`: estatus en agendada/confirmada + ventana mínima
 * de horas) — este componente solo lee el booleano, nunca reimplementa la
 * regla de negocio.
 */
export default function MisCitasPage() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState<CitaPortal[] | null>(null);
  const [citasLoading, setCitasLoading] = useState(true);
  const [citasError, setCitasError] = useState<string | null>(null);

  const [citaACancelar, setCitaACancelar] = useState<CitaPortal | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [folioEnVuelo, setFolioEnVuelo] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCitasLoading(true);
    listarCitas()
      .then((data) => {
        if (activo) setCitas(data);
      })
      .catch((err) => {
        if (activo) setCitasError(messageFor(err));
      })
      .finally(() => {
        if (activo) setCitasLoading(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const handleAbrirCancelacion = (cita: CitaPortal) => {
    setCitaACancelar(cita);
    setMotivoCancelacion("");
    setCancelError(null);
  };

  const handleCerrarModal = () => {
    if (folioEnVuelo) return; // no cerrar mientras hay una cancelación en curso
    setCitaACancelar(null);
    setMotivoCancelacion("");
    setCancelError(null);
  };

  const handleConfirmarCancelacion = async () => {
    if (!citaACancelar || folioEnVuelo) return;
    const folio = citaACancelar.folio;

    setFolioEnVuelo(folio);
    setCancelError(null);

    try {
      const resultado = await cancelarCita(folio, motivoCancelacion);

      setCitas((prev) =>
        prev
          ? prev.map((c) =>
              c.folio === folio
                ? { ...c, estatus: resultado.estatus, cancelable: false }
                : c
            )
          : prev
      );
      setCitaACancelar(null);
      setMotivoCancelacion("");
      setSuccessMessage(`La cita ${folio} fue cancelada.`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        setCancelError("El motivo ingresado no es válido. Volvé a intentarlo.");
      } else {
        // CITA_NO_ENCONTRADA, NO_AUTORIZADO, ESTADO_NO_CANCELABLE,
        // FUERA_DE_VENTANA, INTERNAL_SERVER_ERROR, RATE_LIMITED,
        // NETWORK_ERROR, REQUEST_ERROR: el backend ya redacta el mensaje en
        // español llano orientado al paciente (ver
        // apps/portal_citas/uses_case/cancelar_cita_usecase.py).
        setCancelError(messageFor(err));
      }
    } finally {
      setFolioEnVuelo(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Mis citas</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Sacar cita
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {successMessage && (
          <div
            role="status"
            className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            {successMessage}
          </div>
        )}

        {citasLoading && (
          <p className="text-sm text-slate-500">Cargando tus citas…</p>
        )}

        {citasError && <ErrorAlert message={citasError} />}

        {!citasLoading && !citasError && citas !== null && citas.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              Todavía no tenés citas agendadas.
            </p>
            <Link
              to="/"
              className="rounded-md bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Sacar una cita
            </Link>
          </div>
        )}

        {!citasLoading && !citasError && citas !== null && citas.length > 0 && (
          <ul className="flex flex-col gap-3">
            {citas.map((cita) => (
              <li
                key={cita.folio}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Folio {cita.folio}
                    </span>
                    <span className="font-medium capitalize text-slate-800">
                      {FORMATO_FECHA_HORA.format(new Date(cita.fechaHora))}
                    </span>
                  </div>
                  <EstatusBadge estatus={cita.estatus} />
                </div>

                <dl className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Para</dt>
                    <dd className="font-medium text-slate-800">
                      {cita.paraQuien ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Especialidad</dt>
                    <dd className="font-medium text-slate-800">
                      {cita.servicioTipo === "medicina_general"
                        ? "Medicina general"
                        : cita.servicioTipo}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Médico</dt>
                    <dd className="font-medium text-slate-800">
                      {cita.medicoNombre}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Consultorio</dt>
                    <dd className="font-medium text-slate-800">
                      {cita.consultorioNombre ?? "Sin asignar"}
                    </dd>
                  </div>
                </dl>

                {cita.cancelable && (
                  <button
                    type="button"
                    onClick={() => handleAbrirCancelacion(cita)}
                    disabled={folioEnVuelo === cita.folio}
                    className="self-start rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {folioEnVuelo === cita.folio ? "Cancelando…" : "Cancelar"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {citaACancelar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-slate-800">
                ¿Cancelar esta cita?
              </h2>
              <p className="text-sm text-slate-600">
                Folio {citaACancelar.folio} ·{" "}
                {FORMATO_FECHA_HORA.format(new Date(citaACancelar.fechaHora))}
              </p>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label
                htmlFor="motivoCancelacion"
                className="text-sm font-medium text-slate-700"
              >
                Motivo de la cancelación (opcional)
              </label>
              <textarea
                id="motivoCancelacion"
                rows={3}
                maxLength={500}
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                disabled={folioEnVuelo !== null}
                placeholder="Ej. ya no puedo asistir, se resolvió por otro medio…"
                className="resize-none rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
              />
            </div>

            {cancelError && <ErrorAlert message={cancelError} />}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCerrarModal}
                disabled={folioEnVuelo !== null}
                className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Volver
              </button>
              <Button
                type="button"
                loading={folioEnVuelo !== null}
                onClick={handleConfirmarCancelacion}
              >
                Confirmar cancelación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
