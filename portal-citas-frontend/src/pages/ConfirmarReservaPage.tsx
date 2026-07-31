import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getReservaDraft, clearReservaDraft } from "@/api/reservaDraftStore";
import { setReservaResultado } from "@/api/reservaResultadoStore";
import { reservarCita } from "@/api/citas.api";
import { ApiError } from "@/api/client";
import Button from "@/components/Button";
import ErrorAlert from "@/components/ErrorAlert";

/**
 * Confirmación de reserva (Fase F3). Muestra el resumen del draft
 * (`@/api/reservaDraftStore.ts`, ya cargado en F2) y dispara
 * `POST /portal/citas` (`@/api/citas.api.ts`) al confirmar.
 *
 * Manejo de errores por código — ver contrato completo comentado en
 * `citas.api.ts`. Se muestra el mensaje que ya manda el backend
 * (`error.message`, vía `ApiError`) porque backend/apps/portal_citas/
 * errors.py ya redacta esos mensajes en español llano orientado al
 * paciente (ej. "Ese horario ya no está disponible.", "Ya tenés otra cita
 * agendada en un horario que se cruza con este."); solo se overridea el
 * texto para `VALIDATION_ERROR` (mensaje de backend genérico, "Datos
 * inválidos.", no dice qué hacer) y se agrega un CTA específico para
 * `SLOT_NO_DISPONIBLE` (volver a elegir horario) que para el resto no
 * aplica.
 */
export default function ConfirmarReservaPage() {
  const navigate = useNavigate();
  const draft = getReservaDraft();

  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotNoDisponible, setSlotNoDisponible] = useState(false);

  if (!draft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-800">
          No hay ninguna reserva en curso
        </h1>
        <p className="max-w-md text-slate-600">
          Volvé a elegir un paciente y un horario para continuar.
        </p>
        <Button type="button" onClick={() => navigate("/", { replace: true })}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  const handleConfirmar = async () => {
    if (enviando) return; // evita doble submit por doble click
    setEnviando(true);
    setError(null);
    setSlotNoDisponible(false);

    try {
      const resultado = await reservarCita({
        miembroId: draft.miembroId,
        slotId: draft.slot.slotId,
        motivo,
      });

      setReservaResultado(resultado);
      clearReservaDraft();
      navigate("/reservar/exito", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "SLOT_NO_DISPONIBLE") {
          setSlotNoDisponible(true);
          setError(err.message);
        } else if (err.code === "VALIDATION_ERROR") {
          setError(
            "Hubo un problema con los datos de la reserva. Volvé a intentarlo."
          );
        } else {
          // NO_AUTORIZADO, CITA_SUPERPUESTA, INTERNAL_SERVER_ERROR,
          // RATE_LIMITED, NETWORK_ERROR, REQUEST_ERROR: el mensaje que ya
          // arma `ApiError`/el backend es claro y en español.
          setError(err.message);
        }
      } else {
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
      }
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-6">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold text-slate-800">
            Confirmar cita
          </h1>
          <p className="text-sm text-slate-500">
            Revisá los datos antes de confirmar.
          </p>
        </div>

        <dl className="flex flex-col gap-2 rounded-md bg-slate-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Paciente</dt>
            <dd className="font-medium text-slate-800">
              {draft.nombreVisibleMiembro}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Fecha</dt>
            <dd className="font-medium text-slate-800">{draft.slot.fecha}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Hora</dt>
            <dd className="font-medium text-slate-800">{draft.slot.hora}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Especialidad</dt>
            <dd className="font-medium text-slate-800">
              {draft.slot.especialidadPrincipal}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Médico</dt>
            <dd className="font-medium text-slate-800">
              {draft.slot.medicoNombre}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Consultorio</dt>
            <dd className="font-medium text-slate-800">
              {draft.slot.consultorioNombre ?? "Sin asignar"}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-1 text-left">
          <label
            htmlFor="motivo"
            className="text-sm font-medium text-slate-700"
          >
            Motivo de la consulta (opcional)
          </label>
          <textarea
            id="motivo"
            name="motivo"
            rows={3}
            maxLength={255}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={enviando}
            placeholder="Ej. dolor de cabeza, revisión de rutina…"
            className="resize-none rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          />
        </div>

        {error && (
          <div className="flex flex-col gap-3">
            <ErrorAlert message={error} />
            {slotNoDisponible && (
              <Button
                type="button"
                onClick={() => navigate("/", { replace: true })}
              >
                Elegir otro horario
              </Button>
            )}
          </div>
        )}

        {!(error && slotNoDisponible) && (
          <Button type="button" loading={enviando} onClick={handleConfirmar}>
            Confirmar cita
          </Button>
        )}
      </div>
    </div>
  );
}
