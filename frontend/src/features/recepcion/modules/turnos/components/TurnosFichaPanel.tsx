/**
 * TurnosFichaPanel — Panel para ver y configurar turnos de fichas desde recepción.
 *
 * Muestra:
 *  - Turno activo ahora con fichas usadas / disponibles
 *  - Lista de turnos configurados con opción de editar max_fichas
 */

import { useState } from "react";
import { Clock, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { Badge }   from "@shared/ui/badge";
import { Button }  from "@shared/ui/button";
import { Input }   from "@shared/ui/input";
import { Label }   from "@shared/ui/label";
import {
  useTurnoActual,
  useTurnosFichaList,
  useCreateTurnoFicha,
  useUpdateTurnoFicha,
} from "@features/recepcion/modules/turnos/hooks/useTurnosFicha";
import type { TurnoFichaConfig } from "@api/types/turnos-ficha.types";

// ─── Estado del formulario de edición ────────────────────────────────────────

interface TurnoForm {
  horaInicio: string;
  horaFin:    string;
  maxFichas:  string;
}

function turnoToForm(turno: TurnoFichaConfig): TurnoForm {
  return {
    horaInicio: turno.horaInicio?.slice(0, 5) ?? "",
    horaFin:    turno.horaFin?.slice(0, 5)    ?? "",
    maxFichas:  String(turno.maxFichas),
  };
}

// ─── Fila editable de turno ───────────────────────────────────────────────────

function TurnoRow({ turno }: { turno: TurnoFichaConfig }) {
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<TurnoForm>(() => turnoToForm(turno));
  const update = useUpdateTurnoFicha(turno.id);

  const setField = (field: keyof TurnoForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    const maxFichas = Number(form.maxFichas);
    if (!maxFichas || maxFichas < 1) {
      toast.error("El número de fichas debe ser mayor a 0.");
      return;
    }
    if (!form.horaInicio || !form.horaFin) {
      toast.error("Las horas de inicio y fin son requeridas.");
      return;
    }
    if (form.horaInicio >= form.horaFin) {
      toast.error("La hora de inicio debe ser menor a la hora de fin.");
      return;
    }
    try {
      await update.mutateAsync({
        horaInicio: form.horaInicio,
        horaFin:    form.horaFin,
        maxFichas,
      });
      toast.success(`Turno "${turno.nombre}" actualizado.`);
      setEditing(false);
    } catch {
      toast.error("No se pudo actualizar el turno.");
    }
  };

  const handleCancel = () => {
    setForm(turnoToForm(turno));
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-line-struct bg-paper p-4 space-y-4">

      {/* Encabezado siempre visible */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-txt-body">{turno.nombre}</p>
          {!editing ? (
            <p className="text-xs text-txt-muted mt-0.5">
              {turno.horaInicio?.slice(0, 5)} – {turno.horaFin?.slice(0, 5)}
              {" · "}
              <span className="font-medium text-txt-body">{turno.maxFichas}</span> fichas máx.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={turno.isActive ? "stable" : "secondary"} className="text-xs">
            {turno.isActive ? "Activo" : "Inactivo"}
          </Badge>
          {!editing ? (
            <button
              type="button"
              className="rounded-lg p-1.5 text-txt-muted hover:bg-subtle hover:text-txt-body transition-colors"
              onClick={() => setEditing(true)}
              title="Editar turno"
            >
              <Settings className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Formulario de edición */}
      {editing ? (
        <div className="space-y-4 pt-2 border-t border-line-hairline">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Hora inicio</Label>
              <Input
                type="time"
                value={form.horaInicio}
                onChange={setField("horaInicio")}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hora fin</Label>
              <Input
                type="time"
                value={form.horaFin}
                onChange={setField("horaFin")}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Máx. fichas</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={form.maxFichas}
                onChange={setField("maxFichas")}
                className="h-9"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={update.isPending}
            >
              {update.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Formulario de creación ───────────────────────────────────────────────────

const EMPTY_FORM: TurnoForm & { nombre: string } = {
  nombre:     "",
  horaInicio: "",
  horaFin:    "",
  maxFichas:  "30",
};

function CreateTurnoForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const create = useCreateTurnoFicha();

  const setField = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre del turno es requerido."); return; }
    if (!form.horaInicio || !form.horaFin) { toast.error("Las horas de inicio y fin son requeridas."); return; }
    if (form.horaInicio >= form.horaFin) { toast.error("La hora de inicio debe ser menor a la hora de fin."); return; }
    const maxFichas = Number(form.maxFichas);
    if (!maxFichas || maxFichas < 1) { toast.error("El número de fichas debe ser mayor a 0."); return; }
    try {
      await create.mutateAsync({ nombre: form.nombre.trim(), horaInicio: form.horaInicio, horaFin: form.horaFin, maxFichas });
      toast.success(`Turno "${form.nombre}" creado.`);
      setForm(EMPTY_FORM);
      onCreated();
    } catch {
      toast.error("No se pudo crear el turno.");
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
      <p className="text-sm font-semibold text-primary">Nuevo turno</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-1">
          <Label className="text-xs">Nombre</Label>
          <Input placeholder="Ej. Matutino" value={form.nombre} onChange={setField("nombre")} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hora inicio</Label>
          <Input type="time" value={form.horaInicio} onChange={setField("horaInicio")} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hora fin</Label>
          <Input type="time" value={form.horaFin} onChange={setField("horaFin")} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Máx. fichas</Label>
          <Input type="number" min={1} max={500} value={form.maxFichas} onChange={setField("maxFichas")} className="h-9" />
        </div>
      </div>
      <Button size="sm" className="gap-2" onClick={() => void handleCreate()} disabled={create.isPending}>
        <Plus className="size-4" />
        {create.isPending ? "Creando..." : "Crear turno"}
      </Button>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function TurnosFichaPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: actual, isLoading: loadingActual } = useTurnoActual();
  const { data: turnos, isLoading: loadingTurnos } = useTurnosFichaList();

  const turnosLista = turnos ?? [];

  return (
    <div className="space-y-5">

      {/* ── Turno actual ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-line-struct bg-paper p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <p className="text-sm font-semibold text-txt-body">Turno actual</p>
        </div>

        {loadingActual ? (
          <p className="text-xs text-txt-muted">Cargando...</p>
        ) : !actual?.turno ? (
          <p className="text-xs text-txt-muted italic">
            No hay turno configurado para este horario.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-subtle/40 px-3 py-2 text-center">
              <p className="text-xs text-txt-muted">Turno</p>
              <p className="text-base font-bold text-txt-body">{actual.turno.nombre}</p>
            </div>
            <div className="rounded-lg bg-subtle/40 px-3 py-2 text-center">
              <p className="text-xs text-txt-muted">Fichas usadas</p>
              <p className={`text-base font-bold ${actual.fichasUsadas >= actual.maxFichas ? "text-status-critical" : "text-txt-body"}`}>
                {actual.fichasUsadas} / {actual.maxFichas}
              </p>
            </div>
            <div className="rounded-lg bg-subtle/40 px-3 py-2 text-center">
              <p className="text-xs text-txt-muted">Disponibles</p>
              <p className={`text-base font-bold ${actual.disponibles === 0 ? "text-status-critical" : "text-status-stable"}`}>
                {actual.disponibles}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Configuración de turnos ───────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-txt-muted">
            Configuración de fichas por turno
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus className="size-3.5" />
            {showCreate ? "Cancelar" : "Agregar turno"}
          </Button>
        </div>

        {showCreate ? (
          <CreateTurnoForm onCreated={() => setShowCreate(false)} />
        ) : null}

        {loadingTurnos ? (
          <p className="text-xs text-txt-muted">Cargando...</p>
        ) : turnosLista.length === 0 ? (
          <p className="text-xs text-txt-muted italic">
            Sin turnos configurados. Usá el botón "Agregar turno" para crear el primero.
          </p>
        ) : (
          <div className="space-y-2">
            {turnosLista.map((t) => (
              <TurnoRow key={t.id} turno={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
