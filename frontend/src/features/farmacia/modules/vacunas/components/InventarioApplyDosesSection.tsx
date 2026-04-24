import { useState } from "react";
import { Syringe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Separator } from "@shared/ui/separator";
import type { InventarioVacunaDetail } from "@api/types";
import { useApplyDoses } from "../mutations/useApplyDoses";
import { getInventarioErrorMessage } from "../utils/inventario-vacunas.feedback";

interface InventarioApplyDosesSectionProps {
  detail: InventarioVacunaDetail;
  canApply: boolean;
}

export function InventarioApplyDosesSection({ detail, canApply }: InventarioApplyDosesSectionProps) {
  const [doses, setDoses] = useState<string>("");
  const applyDoses = useApplyDoses();

  const available = detail.availableDoses;
  const dosesNum = Number(doses);
  const isValid = Number.isInteger(dosesNum) && dosesNum > 0 && dosesNum <= available;
  const isDisabled = !canApply || !detail.isActive || applyDoses.isPending;

  const handleApply = async () => {
    if (!isValid || isDisabled) return;
    try {
      const result = await applyDoses.mutateAsync({ inventarioId: detail.id, doses: dosesNum });
      toast.success("Dosis aplicadas", {
        description: `Se registraron ${result.dosesApplied} dosis de ${detail.vaccine.name}.`,
      });
      setDoses("");
    } catch (error) {
      toast.error("No se pudo aplicar", {
        description: getInventarioErrorMessage(error, "Error al aplicar dosis"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-txt-muted">Existencia total</Label>
          <Input value={detail.stockQuantity} disabled />
        </div>
        <div className="space-y-2">
          <Label className="text-txt-muted">Dosis aplicadas</Label>
          <Input value={detail.appliedDoses} disabled />
        </div>
        <div className="space-y-2">
          <Label className="text-txt-muted">Disponibles</Label>
          <Input value={available} disabled />
        </div>
      </div>

      <Separator />

      {!detail.isActive && (
        <p className="rounded-xl border border-status-warning/30 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
          Este registro está inactivo. No se pueden aplicar dosis.
        </p>
      )}

      {detail.isActive && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doses-input">Cantidad de dosis a aplicar</Label>
            <div className="flex gap-3">
              <Input
                id="doses-input"
                type="number"
                min={1}
                max={available}
                value={doses}
                onChange={(e) => setDoses(e.target.value)}
                placeholder={`Máx. ${available}`}
                disabled={isDisabled || available === 0}
                className="max-w-[180px]"
              />
              <Button
                type="button"
                onClick={() => void handleApply()}
                disabled={!isValid || isDisabled}
                className="gap-2"
              >
                <Syringe className="size-4" />
                {applyDoses.isPending ? "Aplicando..." : "Aplicar dosis"}
              </Button>
            </div>
            {doses !== "" && !isValid && dosesNum > 0 && (
              <p className="text-sm text-status-critical">
                {dosesNum > available
                  ? `Máximo disponible: ${available}`
                  : "Ingresá un número entero mayor a 0"}
              </p>
            )}
            {available === 0 && (
              <p className="text-sm text-txt-muted">No hay dosis disponibles para aplicar.</p>
            )}
          </div>

          {!canApply && (
            <p className="text-sm text-txt-muted">
              No tenés permisos para aplicar dosis.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
