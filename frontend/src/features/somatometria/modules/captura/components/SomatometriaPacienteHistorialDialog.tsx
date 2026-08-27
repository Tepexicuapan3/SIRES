import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import type { VisitQueueItem } from "@api/types";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useSomatometriaPacienteHistorial } from "@features/somatometria/modules/captura/queries/useSomatometriaPacienteHistorial";
import { EditVitalsDialog } from "@features/somatometria/modules/captura/components/EditVitalsDialog";

const SOMATOMETRIA_EDIT_PERMISSION_REQUIREMENT = {
  allOf: ["clinico:somatometria:update"],
} as const;

/** Mismo criterio de formato que `SomatometriaHistorialView.tsx` /
 * `SomatometriaQueueCards.tsx` (dia/mes/año + hora:minuto, 24h, es-MX).
 * Duplicado deliberado y minimo -- ver nota en `SomatometriaHistorialView.tsx`
 * sobre por que no se exporta desde ahi (mezclaria exports de
 * componente + funcion y rompe fast-refresh). */
const formatFechaHora = (iso: string): string =>
  new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

interface SomatometriaPacienteHistorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noExp: string | undefined;
  pkNum: number | undefined;
  nombrePaciente?: string | null;
}

function HistorialVisitCard({
  visit,
  canEdit,
  onEdit,
}: {
  visit: VisitQueueItem;
  canEdit: boolean;
  onEdit: (visit: VisitQueueItem) => void;
}) {
  return (
    <article
      data-testid={`somato-paciente-historial-item-${visit.id}`}
      className="rounded-xl border border-line-struct bg-paper p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-txt-muted">{visit.folio}</span>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {visit.status}
          </Badge>
          {canEdit && visit.vitals ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              data-testid={`somato-paciente-historial-edit-${visit.id}`}
              onClick={() => onEdit(visit)}
            >
              Editar
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-1 text-xs text-txt-muted">
        {visit.fechaAlta ? formatFechaHora(visit.fechaAlta) : "Fecha no disponible"}
      </p>

      {visit.vitals ? (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-txt-muted">Peso</dt>
            <dd className="font-semibold text-txt-body">
              {visit.vitals.weightKg} kg
            </dd>
          </div>
          <div>
            <dt className="text-txt-muted">Talla</dt>
            <dd className="font-semibold text-txt-body">
              {visit.vitals.heightCm} cm
            </dd>
          </div>
          <div>
            <dt className="text-txt-muted">IMC</dt>
            <dd className="font-semibold text-txt-body">{visit.vitals.bmi}</dd>
          </div>
          {visit.vitals.temperatureC != null ? (
            <div>
              <dt className="text-txt-muted">Temp.</dt>
              <dd className="font-semibold text-txt-body">
                {visit.vitals.temperatureC} °C
              </dd>
            </div>
          ) : null}
          {visit.vitals.oxygenSaturationPct != null ? (
            <div>
              <dt className="text-txt-muted">Sat. O2</dt>
              <dd className="font-semibold text-txt-body">
                {visit.vitals.oxygenSaturationPct}%
              </dd>
            </div>
          ) : null}
          {visit.vitals.bloodPressureSystolic != null &&
          visit.vitals.bloodPressureDiastolic != null ? (
            <div>
              <dt className="text-txt-muted">T.A.</dt>
              <dd className="font-semibold text-txt-body">
                {visit.vitals.bloodPressureSystolic}/
                {visit.vitals.bloodPressureDiastolic}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-2 text-xs italic text-txt-muted">
          Sin signos vitales capturados en esta visita.
        </p>
      )}
    </article>
  );
}

/**
 * Historial de un paciente especifico -- abierto desde la tarjeta de la
 * cola/historial de somatometria (D14). Reusa `GET /visits?noExp&pkNum`
 * (via `useSomatometriaPacienteHistorial`), SIN endpoint backend nuevo.
 * Orden `-id_visit` (mas reciente primero), tal como lo devuelve el
 * backend por default.
 */
export function SomatometriaPacienteHistorialDialog({
  open,
  onOpenChange,
  noExp,
  pkNum,
  nombrePaciente,
}: SomatometriaPacienteHistorialDialogProps) {
  const { data, isLoading, isError } = useSomatometriaPacienteHistorial({
    noExp,
    pkNum,
    page: 1,
    pageSize: 50,
  });

  const { hasCapability } = usePermissionDependencies();
  const canEditVitals = hasCapability(
    "flow.somatometria.edit",
    SOMATOMETRIA_EDIT_PERMISSION_REQUIREMENT,
  );

  const [editingVisit, setEditingVisit] = useState<VisitQueueItem | null>(null);

  const visits = data?.items ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
          data-testid="somato-paciente-historial-dialog"
        >
          <DialogHeader>
            <DialogTitle>
              Historial de {nombrePaciente || `Exp. ${noExp ?? "—"}`}
            </DialogTitle>
            <DialogDescription>
              Exp. {noExp ?? "—"} · {pkNum === 0 ? "Titular" : `Familiar #${pkNum}`}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <p className="text-sm text-txt-muted">Cargando historial...</p>
          ) : null}

          {isError ? (
            <p className="text-sm text-status-critical">
              No se pudo cargar el historial de este paciente.
            </p>
          ) : null}

          {!isLoading && !isError && visits.length === 0 ? (
            <p className="text-sm text-txt-muted">
              Sin visitas registradas para este paciente.
            </p>
          ) : null}

          {!isLoading && !isError && visits.length > 0 ? (
            <div className="space-y-2" data-testid="somato-paciente-historial-list">
              {visits.map((visit) => (
                <HistorialVisitCard
                  key={visit.id}
                  visit={visit}
                  canEdit={canEditVitals}
                  onEdit={setEditingVisit}
                />
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {editingVisit?.vitals ? (
        <EditVitalsDialog
          open={editingVisit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setEditingVisit(null);
          }}
          visitId={editingVisit.id}
          vitals={editingVisit.vitals}
          nombrePaciente={nombrePaciente}
        />
      ) : null}
    </>
  );
}

export default SomatometriaPacienteHistorialDialog;
