import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@shared/ui/select";
import { useMedicoExcepciones, useCreateExcepcion, useDeleteExcepcion } from "@features/admin/modules/medicos/hooks/useMedicos";
import type { TipoExcepcion } from "@api/types/medicos.types";

const TIPO_LABELS: Record<TipoExcepcion, string> = {
  VACACIONES: "Vacaciones", INCAPACIDAD: "Incapacidad", PERMISO: "Permiso",
  HORA_COMIDA: "Hora de comida", CAPACITACION: "Capacitación",
  AUSENCIA: "Ausencia", SUSPENSION: "Suspensión", CAMBIO_HORARIO: "Cambio de horario",
};

const TIPO_BADGE_VARIANT: Record<TipoExcepcion, "alert" | "secondary" | "critical" | "outline"> = {
  VACACIONES: "alert", INCAPACIDAD: "alert", PERMISO: "outline",
  HORA_COMIDA: "outline", CAPACITACION: "outline",
  AUSENCIA: "secondary", SUSPENSION: "critical", CAMBIO_HORARIO: "outline",
};

interface Props { medicoId: number; isEditable: boolean; }

export function MedicoExcepcionesTab({ medicoId, isEditable }: Props) {
  const { data, isLoading } = useMedicoExcepciones(medicoId);
  const createExc = useCreateExcepcion(medicoId);
  const deleteExc = useDeleteExcepcion(medicoId);

  const [tipo, setTipo] = useState<TipoExcepcion>("VACACIONES");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");

  const handleAdd = async () => {
    if (!fechaInicio || !fechaFin) return;
    try {
      await createExc.mutateAsync({
        tipo,
        fechaInicio,
        fechaFin,
        horaInicio: horaInicio || null,
        horaFin: horaFin || null,
        motivo: motivo || null,
      });
      setFechaInicio(""); setFechaFin(""); setHoraInicio(""); setHoraFin(""); setMotivo("");
      toast.success("Excepción registrada.");
    } catch {
      toast.error("No se pudo registrar la excepción.");
    }
  };

  const excepciones = data?.items ?? [];

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">Excepciones y ausencias</p>

      {isLoading ? (
        <p className="text-sm text-txt-muted">Cargando...</p>
      ) : excepciones.length === 0 ? (
        <p className="text-sm text-txt-muted italic">Sin excepciones registradas.</p>
      ) : (
        <div className="divide-y divide-line-struct/50 rounded-xl border border-line-struct">
          {excepciones.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant={TIPO_BADGE_VARIANT[e.tipo]} className="text-xs">
                    {TIPO_LABELS[e.tipo]}
                  </Badge>
                </div>
                <p className="text-xs text-txt-muted">
                  {e.fechaInicio} → {e.fechaFin}
                  {e.horaInicio ? ` · ${e.horaInicio} - ${e.horaFin}` : " · Día completo"}
                </p>
                {e.motivo ? <p className="text-xs text-txt-muted mt-0.5">{e.motivo}</p> : null}
              </div>
              {isEditable ? (
                <Button
                  type="button" variant="ghost" size="icon" className="size-8 text-status-critical hover:text-status-critical"
                  disabled={deleteExc.isPending}
                  onClick={() => void deleteExc.mutateAsync(e.id).then(() => toast.success("Excepción eliminada."))}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isEditable ? (
        <div className="space-y-3 rounded-xl border border-line-struct/60 bg-subtle/10 p-4">
          <p className="text-xs font-semibold text-txt-muted uppercase">Nueva excepción</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoExcepcion)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha fin</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hora inicio <span className="text-txt-muted">(opcional)</span></Label>
              <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hora fin <span className="text-txt-muted">(opcional)</span></Label>
              <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Motivo <span className="text-txt-muted">(opcional)</span></Label>
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describe el motivo..." className="h-9" />
            </div>
          </div>
          <Button type="button" size="sm" className="gap-2" disabled={!fechaInicio || !fechaFin || createExc.isPending}
            onClick={() => void handleAdd()}>
            {createExc.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Registrar excepción
          </Button>
        </div>
      ) : null}
    </div>
  );
}
