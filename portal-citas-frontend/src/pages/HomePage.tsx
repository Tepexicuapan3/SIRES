import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { obtenerNucleo, type MiembroNucleo } from "@/api/nucleo.api";
import { listarEspecialidades, type Especialidad } from "@/api/especialidades.api";
import type { Slot } from "@/api/slots.api";
import { ApiError } from "@/api/client";
import { clearToken } from "@/api/authStore";
import { setReservaDraft } from "@/api/reservaDraftStore";
import ErrorAlert from "@/components/ErrorAlert";
import SlotsWeekCalendar from "@/components/SlotsWeekCalendar";

type Step = "miembro" | "horario";

/** Mismo criterio que LoginPage.tsx: ApiError trae el mensaje ya listo para mostrar. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

/**
 * Flujo de 3 pasos del portal (Fase F2):
 *   1. Elegir para quién es la cita (núcleo familiar).
 *   2. Buscar horario (especialidad opcional + calendario semanal de slots).
 *   3. Elegir slot -> guarda el draft y navega a /reservar/confirmar
 *      (la reserva real, POST /portal/citas, es Fase F3).
 */
export default function HomePage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("miembro");

  // Paso 1: núcleo familiar.
  const [nucleo, setNucleo] = useState<MiembroNucleo[]>([]);
  const [nucleoLoading, setNucleoLoading] = useState(true);
  const [nucleoError, setNucleoError] = useState<string | null>(null);
  const [miembro, setMiembro] = useState<MiembroNucleo | null>(null);

  // Paso 2: especialidad (el calendario semanal de slots vive en
  // `SlotsWeekCalendar`, que se refresca solo cuando cambia `especialidadId`).
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadId, setEspecialidadId] = useState<number | "">("");

  useEffect(() => {
    let activo = true;
    setNucleoLoading(true);
    obtenerNucleo()
      .then((data) => {
        if (activo) setNucleo(data);
      })
      .catch((err) => {
        if (activo) setNucleoError(messageFor(err));
      })
      .finally(() => {
        if (activo) setNucleoLoading(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (step !== "horario") return;
    let activo = true;
    listarEspecialidades()
      .then((data) => {
        if (activo) setEspecialidades(data);
      })
      .catch(() => {
        // Catálogo secundario: si falla, el selector queda solo con
        // "Todas" — no bloquea la búsqueda de slots por eso.
      });
    return () => {
      activo = false;
    };
  }, [step]);

  const handleElegirMiembro = (elegido: MiembroNucleo) => {
    setMiembro(elegido);
    setStep("horario");
  };

  const handleCambiarPaciente = () => {
    setStep("miembro");
  };

  const handleElegirSlot = (slot: Slot) => {
    if (!miembro) return;
    setReservaDraft(miembro, slot);
    navigate("/reservar/confirmar");
  };

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Citas en Línea</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/mis-citas"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Mis citas
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

        {step === "miembro" && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-slate-700">
              ¿Para quién es la cita?
            </h2>

            {nucleoLoading && (
              <p className="text-sm text-slate-500">Cargando pacientes…</p>
            )}
            {nucleoError && <ErrorAlert message={nucleoError} />}

            {!nucleoLoading && !nucleoError && nucleo.length === 0 && (
              <p className="text-sm text-slate-500">
                No encontramos pacientes asociados a tu sesión.
              </p>
            )}

            {!nucleoLoading && !nucleoError && nucleo.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {nucleo.map((m) => (
                  <button
                    key={m.miembroId}
                    type="button"
                    onClick={() => handleElegirMiembro(m)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-100"
                  >
                    <span className="font-medium text-slate-800">
                      {m.nombreVisible}
                    </span>
                    {m.esMenor && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Menor
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === "horario" && miembro && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-700">
                Buscar horario para {miembro.nombreVisible}
              </h2>
              <button
                type="button"
                onClick={handleCambiarPaciente}
                className="text-sm font-medium text-slate-600 underline hover:text-slate-800"
              >
                Cambiar paciente
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="especialidad" className="text-sm font-medium text-slate-700">
                Especialidad
              </label>
              <select
                id="especialidad"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                value={especialidadId}
                onChange={(e) =>
                  setEspecialidadId(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">Todas</option>
                {especialidades.map((e) => (
                  <option key={e.especialidadId} value={e.especialidadId}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>

            <SlotsWeekCalendar especialidadId={especialidadId} onSlotClick={handleElegirSlot} />
          </section>
        )}
      </div>
    </div>
  );
}
