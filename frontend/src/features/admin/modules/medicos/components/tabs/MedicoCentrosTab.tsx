import { useState } from "react";
import { Loader2, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Label } from "@shared/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@shared/ui/select";
import { CatalogCombobox, type CatalogOption } from "@/domains/auth-access/components/admin/rbac/users/CatalogCombobox";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useAddCentro, useRemoveCentro } from "@features/admin/modules/medicos/hooks/useMedicos";
import type { MedicoDetail } from "@api/types/medicos.types";

interface Props { medico: MedicoDetail; isEditable: boolean; }

export function MedicoCentrosTab({ medico, isEditable }: Props) {
  const [centroId, setCentroId] = useState<number | null>(null);
  const [tipoAdscripcion, setTipoAdscripcion] = useState<"DEFINITIVA" | "TEMPORAL">("DEFINITIVA");

  const addCentro = useAddCentro(medico.id);
  const removeCentro = useRemoveCentro(medico.id);

  const { data: centrosData } = useCentrosAtencionList({ isActive: true });
  const centroOptions: CatalogOption[] = (centrosData?.items ?? []).map((c) => ({
    id: c.id, name: c.name, isActive: true,
  }));

  const handleAdd = async () => {
    if (!centroId) return;
    try {
      await addCentro.mutateAsync({
        centroId,
        tipoAdscripcion,
        fechaInicio: new Date().toISOString().slice(0, 10),
      });
      setCentroId(null);
      toast.success("Centro agregado.");
    } catch {
      toast.error("No se pudo agregar el centro.");
    }
  };

  const handleRemove = async (relId: number) => {
    try {
      await removeCentro.mutateAsync(relId);
      toast.success("Adscripción terminada.");
    } catch {
      toast.error("No se pudo actualizar.");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">Centros de atención</p>

      {medico.centros.length === 0 ? (
        <p className="text-sm text-txt-muted italic">Sin centros asignados.</p>
      ) : (
        <div className="divide-y divide-line-struct/50 rounded-xl border border-line-struct">
          {medico.centros.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <MapPin className="size-4 shrink-0 text-txt-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.centroNombre}</p>
                <p className="text-xs text-txt-muted">
                  Desde {c.fechaInicio}{c.fechaFin ? ` · Hasta ${c.fechaFin}` : ""}
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {c.tipoAdscripcion === "DEFINITIVA" ? "Definitiva" : "Temporal"}
              </Badge>
              {isEditable ? (
                <Button
                  type="button" variant="ghost" size="icon" className="size-8 text-txt-muted"
                  disabled={removeCentro.isPending}
                  onClick={() => void handleRemove(c.id)}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isEditable ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Centro a agregar</Label>
            <CatalogCombobox value={centroId} onChange={setCentroId} options={centroOptions}
              placeholder="Selecciona centro" emptyLabel="Sin seleccionar" searchPlaceholder="Buscar centro..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de adscripción</Label>
            <Select value={tipoAdscripcion} onValueChange={(v) => setTipoAdscripcion(v as "DEFINITIVA" | "TEMPORAL")}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFINITIVA">Definitiva</SelectItem>
                <SelectItem value="TEMPORAL">Temporal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" className="h-11 w-full gap-2"
              disabled={!centroId || addCentro.isPending}
              onClick={() => void handleAdd()}>
              {addCentro.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Agregar centro
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
