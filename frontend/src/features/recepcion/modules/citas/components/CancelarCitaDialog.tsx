import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Textarea } from "@shared/ui/textarea";
import { useUpdateEstatusCita } from "@features/recepcion/modules/citas/mutations/useCitaMutations";
import { resolveDomainErrorMessage } from "@features/recepcion/modules/agenda/pages/RecepcionAgendaPage.helpers";
import {
  CITA_ESTATUS_DOMAIN_ERROR_MESSAGE,
  FALLBACK_CITA_ESTATUS_ERROR_MESSAGE,
} from "@features/recepcion/modules/citas/domain/citaEstatus.errors";

export interface CitaACancelar {
  id:    number;
  folio: string;
  noExp: string;
  fecha: string;  // YYYY-MM-DD
  hora:  string;  // HH:mm
}

interface CancelarCitaDialogProps {
  cita:         CitaACancelar | null;
  onOpenChange: (open: boolean) => void;
}

function formatFechaCorta(fecha: string): string {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day:     "2-digit",
    month:   "long",
  });
}

/**
 * Dialogo de confirmacion para cancelar una CitaMedica desde la agenda de
 * recepcion (`SlotCalendar`). A diferencia del portal de citas en linea
 * (donde el motivo es opcional), acá el backend EXIGE motivo para la
 * transicion a "cancelada" (CITA_MOTIVO_REQUERIDO) — por eso el textarea es
 * obligatorio y el boton de confirmar queda deshabilitado sin contenido, en
 * vez de depender solo del 422 del servidor.
 */
export function CancelarCitaDialog({ cita, onOpenChange }: CancelarCitaDialogProps) {
  const [motivo, setMotivo] = useState("");
  const updateEstatus = useUpdateEstatusCita(cita?.id ?? 0);

  useEffect(() => {
    if (cita) {
      setMotivo("");
    }
  }, [cita]);

  const motivoValido = motivo.trim().length > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !updateEstatus.isPending) {
      onOpenChange(false);
    }
  };

  const handleConfirmar = async () => {
    if (!cita || !motivoValido || updateEstatus.isPending) {
      return;
    }

    try {
      await updateEstatus.mutateAsync({ estatus: "cancelada", motivo: motivo.trim() });
      toast.success("Cita cancelada", { description: `Folio ${cita.folio}.` });
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo cancelar la cita", {
        description: resolveDomainErrorMessage(
          error,
          CITA_ESTATUS_DOMAIN_ERROR_MESSAGE,
          FALLBACK_CITA_ESTATUS_ERROR_MESSAGE,
        ),
      });
    }
  };

  return (
    <Dialog open={cita !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar cita</DialogTitle>
          <DialogDescription>
            {cita
              ? `Folio ${cita.folio} · Exp. ${cita.noExp} · ${formatFechaCorta(cita.fecha)}, ${cita.hora} h. Esta accion no se puede deshacer.`
              : "Confirma la cancelacion para continuar."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label
            htmlFor="motivo-cancelacion-cita"
            className="text-sm font-medium text-txt-body"
          >
            Motivo de la cancelacion <span className="text-status-critical">*</span>
          </label>
          <Textarea
            id="motivo-cancelacion-cita"
            rows={3}
            maxLength={255}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={updateEstatus.isPending}
            placeholder="Ej. el paciente solicito reagendar, se resolvio por otro medio..."
            aria-invalid={!motivoValido}
          />
          <p className="text-xs text-txt-muted">
            Obligatorio para cancelar una cita agendada.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateEstatus.isPending}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!motivoValido || updateEstatus.isPending}
            onClick={() => void handleConfirmar()}
          >
            {updateEstatus.isPending ? "Cancelando..." : "Confirmar cancelacion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
