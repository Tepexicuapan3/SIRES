import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import type { ConteoFisico } from "@api/types";
import { useCerrarConteo } from "../mutations/useConteosMutations";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";

interface Props {
  conteo:       ConteoFisico;
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?:   () => void;
}

export function ConteoCerrarDialog({ conteo, open, onOpenChange, onSuccess }: Props) {
  const cerrar = useCerrarConteo();
  const [cantidades, setCantidades] = useState<Record<number, string>>(
    Object.fromEntries(conteo.detalles.map((d) => [d.id, d.cantFisica]))
  );

  const handleCerrar = async () => {
    try {
      await cerrar.mutateAsync({
        id: conteo.id,
        data: {
          detalles: Object.entries(cantidades).map(([id, cantFisica]) => ({
            id:         Number(id),
            cantFisica,
          })),
        },
      });
      onSuccess?.();
    } catch (err) {
      toast.error("Error al cerrar conteo", { description: getCatalogErrorMessage(err, "Verifica el stock.") });
    }
  };

  const diff = (id: number, sistema: string) => {
    const fisica = Number(cantidades[id] ?? sistema);
    const d      = fisica - Number(sistema);
    if (d === 0) return null;
    return <span className={`text-xs font-medium ${d > 0 ? "text-green-600" : "text-destructive"}`}>{d > 0 ? `+${d}` : d}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cerrar conteo — {conteo.almacenNombre} ({conteo.fchConteo})</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Ajusta las cantidades físicas. Al cerrar se generarán movimientos de ajuste en el kardex para las diferencias.
        </p>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="text-left pb-1">Insumo</th>
              <th className="text-left pb-1 w-[80px]">Lote</th>
              <th className="text-right pb-1 w-[90px]">Sistema</th>
              <th className="text-right pb-1 w-[110px]">Física</th>
              <th className="text-right pb-1 w-[70px]">Dif.</th>
            </tr>
          </thead>
          <tbody>
            {conteo.detalles.map((det) => (
              <tr key={det.id} className="border-b last:border-0">
                <td className="py-1 pr-2 text-xs">{det.insumoNombre}</td>
                <td className="py-1 pr-2 text-xs font-mono">{det.numLote || "—"}</td>
                <td className="py-1 pr-2 text-right tabular-nums text-xs text-muted-foreground">{Math.round(Number(det.cantSistema))}</td>
                <td className="py-1 pr-2">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="h-7 text-xs text-right"
                    value={cantidades[det.id] ?? det.cantFisica}
                    onChange={(e) => setCantidades((p) => ({ ...p, [det.id]: e.target.value }))}
                  />
                </td>
                <td className="py-1 text-right">{diff(det.id, det.cantSistema)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { void handleCerrar(); }} disabled={cerrar.isPending}>
            {cerrar.isPending ? "Cerrando..." : "Cerrar conteo y aplicar ajustes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
