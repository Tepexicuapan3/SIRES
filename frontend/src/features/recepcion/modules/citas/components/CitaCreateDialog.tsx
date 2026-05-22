import { useEffect, useState } from "react";
import { CalendarDays, Clock, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Badge }       from "@shared/ui/badge";
import { Button }      from "@shared/ui/button";
import { Input }       from "@shared/ui/input";
import { Label }       from "@shared/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@shared/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@shared/ui/select";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { Separator }  from "@shared/ui/separator";
import { CatalogCombobox, type CatalogOption }
  from "@/domains/auth-access/components/admin/rbac/users/CatalogCombobox";
import { useDebounce } from "@shared/hooks/useDebounce";
import { usePatientLookup }
  from "@features/recepcion/modules/checkin/queries/usePatientLookup";
import { useMedicosDisponibles, useMedicosList }
  from "@features/admin/modules/medicos/hooks/useMedicos";
import { useCentrosAtencionList }
  from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useAgendaSemanal }
  from "@features/recepcion/modules/citas/queries/useAgendaSemanal";
import { useCreateCita }
  from "@features/recepcion/modules/citas/mutations/useCitaMutations";
import type { PatientMember } from "@api/types";
import type { AgendaSlot } from "@api/types/agenda.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
      {children}
    </p>
  );
}

// ─── Tarjeta de miembro familiar ──────────────────────────────────────────────

function MemberCard({
  member, selected, onSelect,
}: {
  member: PatientMember; selected: boolean; onSelect: () => void;
}) {
  const activo = member.estatus === "ACTIVO";
  return (
    <button
      type="button"
      disabled={!activo}
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
        selected     ? "border-primary bg-primary/5" : "border-line-struct hover:bg-subtle/40",
        !activo      ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <div className={[
        "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
        selected ? "border-primary bg-primary" : "border-line-struct",
      ].join(" ")}>
        {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-txt-body">{member.nombre}</p>
        <p className="truncate text-xs text-txt-muted">
          {member.parentesco}
          {member.edad != null ? ` · ${member.edad} años` : ""}
        </p>
      </div>
      <Badge variant={activo ? "stable" : "secondary"} className="shrink-0 text-xs">
        {member.estatus ?? "—"}
      </Badge>
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export function CitaCreateDialog({ open, onOpenChange }: Props) {
  const createCita = useCreateCita();

  // ── 1. Paciente ─────────────────────────────────────────────────────────────
  const [noExp,      setNoExp]      = useState("");
  const [selectedPk, setSelectedPk] = useState<number | null>(null);
  const debouncedNoExp = useDebounce(noExp, 400);

  const { data: patientData, isFetching: buscandoPaciente, isError: pacienteNoEncontrado } =
    usePatientLookup(debouncedNoExp);
  const miembros: PatientMember[] = patientData
    ? [patientData.titular, ...patientData.dependientes].filter((m): m is PatientMember => m !== null)
    : [];

  // ── 2. Fecha ─────────────────────────────────────────────────────────────────
  const [fecha, setFecha] = useState("");

  // ── 3. Centro y médico ───────────────────────────────────────────────────────
  const [centroId, setCentroId] = useState<number | null>(null);
  const [medicoId, setMedicoId] = useState<number | null>(null);

  const { data: centrosData } = useCentrosAtencionList({ isActive: true });
  const centros = centrosData?.items ?? [];

  // Con fecha + centro: médicos disponibles (filtrados y con horario confirmado)
  const { data: disponiblesData, isFetching: cargandoDisponibles } = useMedicosDisponibles(
    centroId ?? undefined,
    fecha,
    open && !!fecha && !!centroId,
  );

  // Sin centro: todos los médicos activos como fallback
  const { data: medicosData } = useMedicosList(
    { estatusMedico: "ACTIVO" },
    { enabled: open && (!fecha || !centroId) },
  );

  const medicoOptions: CatalogOption[] =
    centroId && fecha && disponiblesData
      ? disponiblesData.medicos.map((m) => ({
          id:       m.medicoId,
          name:     m.horaInicio && m.horaFin
            ? `${m.nombreCompleto}  ·  ${m.horaInicio.slice(0, 5)} – ${m.horaFin.slice(0, 5)}`
            : m.nombreCompleto,
          isActive: true,
        }))
      : (medicosData?.items ?? []).map((m) => ({
          id:       m.id,
          name:     m.nombreCompleto,
          isActive: m.isActive,
        }));

  // ── 4. Horario ───────────────────────────────────────────────────────────────
  const [selectedSlot, setSelectedSlot] = useState<AgendaSlot | null>(null);

  const { data: agendaData, isFetching: cargandoSlots } = useAgendaSemanal(
    medicoId,
    fecha,
    fecha,
  );
  const slots: AgendaSlot[] = fecha ? (agendaData?.agenda[fecha] ?? []) : [];

  // ── 5. Detalle ───────────────────────────────────────────────────────────────
  const [servicioTipo, setServicio] = useState("medicina_general");
  const [motivo,       setMotivo]   = useState("");

  // ── Resets en cadena ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setNoExp(""); setSelectedPk(null);
      setFecha(""); setCentroId(null);
      setMedicoId(null); setSelectedSlot(null);
      setServicio("medicina_general"); setMotivo("");
    }
  }, [open]);

  useEffect(() => { setSelectedPk(null); }, [debouncedNoExp]);

  // Cambio de fecha o centro → reinicia médico y slot
  useEffect(() => { setMedicoId(null); setSelectedSlot(null); }, [fecha, centroId]);

  // Cambio de médico → reinicia slot
  useEffect(() => { setSelectedSlot(null); }, [medicoId]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const canSubmit =
    noExp.trim().length > 0 &&
    selectedPk !== null &&
    medicoId   !== null &&
    fecha.length > 0 &&
    selectedSlot !== null &&
    !createCita.isPending;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedSlot) return;
    try {
      await createCita.mutateAsync({
        noExp:         noExp.trim(),
        pkNum:         selectedPk!,
        medicoId:      medicoId!,
        fechaHora:     `${fecha}T${selectedSlot.hora}`,
        consultorioId: selectedSlot.consultorioId ?? undefined,
        servicioTipo:  servicioTipo as "medicina_general" | "especialidad" | "urgencias",
        motivo:        motivo.trim() || undefined,
      });
      toast.success("Cita agendada correctamente.");
      onOpenChange(false);
    } catch (err: unknown) {
      const apiError = err as { code?: string; message?: string };
      const msg =
        apiError?.code === "WRONG_CLINIC"
          ? "El paciente no pertenece al centro de atención de este consultorio."
          : (apiError?.message ?? "No se pudo agendar la cita.");
      toast.error("Error al agendar", { description: msg });
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="w-[96vw] max-w-none overflow-hidden rounded-3xl bg-paper p-0 sm:max-w-[580px]"
      >
        <DialogHeader className="border-b border-line-struct px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <CalendarDays className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Nueva cita médica</DialogTitle>
              <DialogDescription className="text-xs text-txt-muted">
                Expediente → fecha → médico → horario.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[72vh] px-6 pb-2">
          <div className="space-y-5 py-4">

            {/* ── 1. Paciente ────────────────────────────────────────── */}
            <div className="space-y-3">
              <SectionLabel>Paciente</SectionLabel>
              <Input
                placeholder="Número de expediente (ej. 12345)"
                value={noExp}
                onChange={(e) => setNoExp(e.target.value)}
              />
              {debouncedNoExp.length > 0 ? (
                buscandoPaciente ? (
                  <p className="text-xs text-txt-muted">Buscando expediente...</p>
                ) : pacienteNoEncontrado || miembros.length === 0 ? (
                  <p className="text-xs text-status-critical">Expediente no encontrado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {miembros.map((m) => (
                      <MemberCard
                        key={`${m.noExp}-${m.pkNum}`}
                        member={m}
                        selected={selectedPk === m.pkNum}
                        onSelect={() => setSelectedPk(m.pkNum)}
                      />
                    ))}
                  </div>
                )
              ) : null}
            </div>

            <Separator />

            {/* ── 2. Fecha ───────────────────────────────────────────── */}
            <div className="space-y-3">
              <SectionLabel>Fecha de la cita</SectionLabel>
              <Input
                type="date"
                value={fecha}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setFecha(e.target.value)}
                className="h-10 w-48"
              />
            </div>

            <Separator />

            {/* ── 3. Médico ──────────────────────────────────────────── */}
            <div className="space-y-3">
              <SectionLabel>Médico</SectionLabel>

              {/* Centro — opcional, filtra médicos disponibles */}
              {centros.length > 1 ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Centro de atención
                    <span className="ml-1 font-normal text-txt-muted">(opcional, filtra disponibilidad)</span>
                  </Label>
                  <select
                    className="h-9 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
                    value={centroId ?? ""}
                    onChange={(e) => setCentroId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Todos los centros</option>
                    {centros.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Selector de médico */}
              <div className="space-y-1.5">
                {centroId && fecha ? (
                  <Label className="text-xs flex items-center gap-1">
                    Médicos disponibles el {fecha}
                    {cargandoDisponibles ? <Loader2 className="size-3 animate-spin" /> : null}
                  </Label>
                ) : (
                  <Label className="text-xs">Médico</Label>
                )}
                <CatalogCombobox
                  value={medicoId}
                  onChange={setMedicoId}
                  options={medicoOptions}
                  placeholder={centroId && fecha ? "Selecciona médico disponible" : "Selecciona médico"}
                  emptyLabel="Sin seleccionar"
                  searchPlaceholder="Buscar por nombre..."
                />
                {centroId && fecha && !cargandoDisponibles && medicoOptions.length === 0 ? (
                  <p className="text-xs text-status-critical">
                    Sin médicos disponibles en ese centro para esa fecha.
                  </p>
                ) : null}
              </div>
            </div>

            <Separator />

            {/* ── 4. Horario ─────────────────────────────────────────── */}
            <div className="space-y-3">
              <SectionLabel>
                Horario
                {cargandoSlots ? <Loader2 className="ml-1 inline size-3 animate-spin" /> : null}
              </SectionLabel>

              {!medicoId || !fecha ? (
                <p className="text-xs text-txt-muted italic">
                  Selecciona médico y fecha primero.
                </p>
              ) : slots.length === 0 && !cargandoSlots ? (
                <p className="text-xs text-txt-muted italic">
                  Sin horarios registrados para ese médico en esa fecha.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {slots.map((s) => {
                    const ocupado    = !s.disponible;
                    const seleccionado = selectedSlot?.hora === s.hora;
                    return (
                      <button
                        key={s.hora}
                        type="button"
                        disabled={ocupado}
                        onClick={() => !ocupado && setSelectedSlot(s)}
                        title={ocupado ? "Horario ocupado" : `Seleccionar ${s.hora}`}
                        className={[
                          "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          ocupado
                            ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400 line-through"
                            : seleccionado
                              ? "border-primary bg-primary text-white"
                              : "border-line-struct hover:border-primary/60 hover:bg-primary/5",
                        ].join(" ")}
                      >
                        <Clock className="size-3" />
                        {s.hora}
                        {s.consultorioNumero != null ? (
                          <span className="opacity-70">· #{s.consultorioNumero}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Resumen del slot seleccionado */}
              {selectedSlot ? (
                <p className="text-xs text-primary font-medium">
                  Seleccionado: {selectedSlot.hora}
                  {selectedSlot.consultorioNumero != null
                    ? ` — Consultorio #${selectedSlot.consultorioNumero}`
                    : ""}
                </p>
              ) : null}
            </div>

            <Separator />

            {/* ── 5. Detalle ─────────────────────────────────────────── */}
            <div className="space-y-3">
              <SectionLabel>Detalle de la cita</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de servicio</Label>
                  <Select value={servicioTipo} onValueChange={setServicio}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicina_general">Medicina general</SelectItem>
                      <SelectItem value="especialidad">Especialidad</SelectItem>
                      <SelectItem value="urgencias">Urgencias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">
                    Motivo <span className="text-txt-muted font-normal">(opcional)</span>
                  </Label>
                  <Input
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Describe brevemente el motivo..."
                    className="h-10"
                    maxLength={255}
                  />
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-line-struct px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createCita.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className="gap-2"
          >
            {createCita.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <Stethoscope className="size-4" />}
            Agendar cita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
