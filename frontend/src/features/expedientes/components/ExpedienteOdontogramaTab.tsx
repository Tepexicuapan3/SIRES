import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { usePatientOdontogram } from "@features/expedientes/queries/usePatientOdontogram";
import { useUpdateOdontogramTooth } from "@features/expedientes/mutations/useUpdateOdontogramTooth";
import type {
  OdontogramDentition,
  OdontogramToothItem,
  ToothCondition,
} from "@api/types";

interface ExpedienteOdontogramaTabProps {
  noExp: string;
  pkNum?: number;
}

const CONDITION_LABELS: Record<ToothCondition, string> = {
  healthy: "Sano",
  caries: "Caries",
  filled: "Obturado",
  crown: "Corona",
  missing: "Ausente",
  extraction_needed: "Extracción Indicada",
  root_canal: "Endodoncia",
  sealant: "Sellante",
  fracture: "Fracturado",
  implant: "Implante",
};

// Todos los tonos son tokens reales del sistema de diseño (theme.css) --
// ninguno es un color "suelto" de Tailwind. Las condiciones dentales
// reutilizan la misma familia --color-area-* que ya usa el resto de la app
// para distinguir áreas clínicas (gyn/geriat/peds), sumadas a los 4 tonos
// clínicos (status-*) y el color de marca.
const CONDITION_COLORS: Record<ToothCondition, string> = {
  healthy: "bg-status-stable/15 border-status-stable text-status-stable",
  caries: "bg-status-critical/15 border-status-critical text-status-critical",
  filled: "bg-status-info/15 border-status-info text-status-info",
  crown: "bg-area-peds/15 border-area-peds text-area-peds",
  missing: "bg-subtle border-line-struct text-txt-muted",
  extraction_needed: "bg-area-gral/15 border-area-gral text-area-gral",
  root_canal: "bg-area-gyn/15 border-area-gyn text-area-gyn",
  sealant: "bg-area-geriat/15 border-area-geriat text-area-geriat",
  fracture: "bg-status-alert/15 border-status-alert text-status-alert",
  implant: "bg-brand/15 border-brand text-brand",
};

export function ExpedienteOdontogramaTab({
  noExp,
  pkNum = 0,
}: ExpedienteOdontogramaTabProps) {
  const [dentition, setDentition] = useState<OdontogramDentition>("permanent");
  const { data, isLoading, isError } = usePatientOdontogram(
    noExp,
    pkNum,
    dentition,
  );

  if (isLoading) {
    return (
      <p className="text-txt-muted text-sm py-12 text-center">
        Cargando odontograma...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-status-critical text-sm py-12 text-center">
        No se pudo cargar el odontograma de este paciente.
      </p>
    );
  }

  const items = data?.items ?? [];
  const half = Math.ceil(items.length / 2);
  const upper = items.slice(0, half);
  const lower = items.slice(half);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={dentition === "permanent" ? "default" : "outline"}
          size="sm"
          onClick={() => setDentition("permanent")}
        >
          Dentición Permanente
        </Button>
        <Button
          type="button"
          variant={dentition === "deciduous" ? "default" : "outline"}
          size="sm"
          onClick={() => setDentition("deciduous")}
        >
          Dentición Infantil
        </Button>
      </div>

      <div className="space-y-6">
        <ToothRow
          label="Arcada superior"
          teeth={upper}
          noExp={noExp}
          pkNum={pkNum}
          dentition={dentition}
        />
        <ToothRow
          label="Arcada inferior"
          teeth={lower}
          noExp={noExp}
          pkNum={pkNum}
          dentition={dentition}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-line-struct">
        {(Object.keys(CONDITION_LABELS) as ToothCondition[]).map((value) => (
          <div
            key={value}
            className="flex items-center gap-1.5 text-xs text-txt-muted"
          >
            <span
              className={`size-3 rounded border-2 ${CONDITION_COLORS[value]}`}
            />
            {CONDITION_LABELS[value]}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToothRow({
  label,
  teeth,
  noExp,
  pkNum,
  dentition,
}: {
  label: string;
  teeth: OdontogramToothItem[];
  noExp: string;
  pkNum: number;
  dentition: OdontogramDentition;
}) {
  return (
    <div>
      <p className="text-xs text-txt-muted mb-2 text-center">{label}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {teeth.map((tooth) => (
          <ToothCell
            key={tooth.toothFdi}
            tooth={tooth}
            noExp={noExp}
            pkNum={pkNum}
            dentition={dentition}
          />
        ))}
      </div>
    </div>
  );
}

function ToothCell({
  tooth,
  noExp,
  pkNum,
  dentition,
}: {
  tooth: OdontogramToothItem;
  noExp: string;
  pkNum: number;
  dentition: OdontogramDentition;
}) {
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState<ToothCondition>(tooth.condition);
  const [notes, setNotes] = useState(tooth.notes ?? "");
  const updateTooth = useUpdateOdontogramTooth();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setCondition(tooth.condition);
      setNotes(tooth.notes ?? "");
    }
    setOpen(nextOpen);
  };

  const handleSave = async () => {
    try {
      await updateTooth.mutateAsync({
        noExp,
        pkNum,
        toothFdi: tooth.toothFdi,
        dentition,
        data: { condition, notes: notes || null },
      });
      toast.success(`Pieza ${tooth.toothFdi} actualizada`);
      setOpen(false);
    } catch {
      toast.error("No se pudo actualizar la pieza", {
        description: "Intenta nuevamente en unos segundos.",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex size-11 items-center justify-center rounded-lg border-2 text-xs font-semibold transition-opacity hover:opacity-80 ${CONDITION_COLORS[tooth.condition]}`}
          title={CONDITION_LABELS[tooth.condition]}
        >
          {tooth.toothFdi}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        <p className="text-sm font-semibold text-txt-body">
          Pieza {tooth.toothFdi}
        </p>
        <div className="space-y-2">
          <Label>Condición</Label>
          <Select
            value={condition}
            onValueChange={(value) => setCondition(value as ToothCondition)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            {/* z-[150]: el Select vive dentro de un Popover (z-[140]) --
                sin esto, la lista de opciones queda detras del popover. */}
            <SelectContent className="z-[150]">
              {(Object.keys(CONDITION_LABELS) as ToothCondition[]).map(
                (value) => (
                  <SelectItem key={value} value={value}>
                    {CONDITION_LABELS[value]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </div>
        <Button
          type="button"
          className="w-full"
          size="sm"
          onClick={() => void handleSave()}
          disabled={updateTooth.isPending}
        >
          {updateTooth.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}
          Guardar
        </Button>
      </PopoverContent>
    </Popover>
  );
}
