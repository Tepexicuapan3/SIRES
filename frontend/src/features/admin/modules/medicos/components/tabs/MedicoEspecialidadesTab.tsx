import { useState } from "react";
import { Loader2, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { CatalogCombobox, type CatalogOption } from "@/domains/auth-access/components/admin/rbac/users/CatalogCombobox";
import { useAddEspecialidad, useRemoveEspecialidad } from "@features/admin/modules/medicos/hooks/useMedicos";
import { useEspecialidadesList } from "@features/admin/modules/catalogos/especialidades/queries/useEspecialidadesList";
import type { MedicoDetail } from "@api/types/medicos.types";

interface Props {
  medico: MedicoDetail;
  isEditable: boolean;
}

export function MedicoEspecialidadesTab({ medico, isEditable }: Props) {
  const [selectedEspId, setSelectedEspId] = useState<number | null>(null);
  const addEsp = useAddEspecialidad(medico.id);
  const removeEsp = useRemoveEspecialidad(medico.id);

  const { data: espData } = useEspecialidadesList({ pageSize: 100, isActive: true });
  const espOptions: CatalogOption[] = (espData?.items ?? []).map((e) => ({
    id: e.id, name: e.name, isActive: e.isActive,
  }));

  const handleAdd = async () => {
    if (!selectedEspId) return;
    try {
      await addEsp.mutateAsync({ especialidadId: selectedEspId, esPrincipal: medico.especialidades.length === 0 });
      setSelectedEspId(null);
      toast.success("Especialidad agregada.");
    } catch {
      toast.error("No se pudo agregar la especialidad.");
    }
  };

  const handleRemove = async (espId: number) => {
    try {
      await removeEsp.mutateAsync(espId);
      toast.success("Especialidad eliminada.");
    } catch {
      toast.error("No se pudo eliminar la especialidad.");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">Especialidades asignadas</p>

      {medico.especialidades.length === 0 ? (
        <p className="text-sm text-txt-muted italic">Sin especialidades registradas.</p>
      ) : (
        <div className="divide-y divide-line-struct/50 rounded-xl border border-line-struct">
          {medico.especialidades.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{e.name}</p>
              </div>
              {e.esPrincipal ? (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Star className="size-3" />Principal
                </Badge>
              ) : null}
              {isEditable ? (
                <Button
                  type="button" variant="ghost" size="icon"
                  className="size-8 text-status-critical hover:text-status-critical"
                  disabled={removeEsp.isPending}
                  onClick={() => void handleRemove(e.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isEditable ? (
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <p className="text-xs text-txt-muted">Agregar especialidad</p>
            <CatalogCombobox
              value={selectedEspId}
              onChange={setSelectedEspId}
              options={espOptions}
              placeholder="Selecciona especialidad"
              emptyLabel="Sin seleccionar"
              searchPlaceholder="Buscar..."
            />
          </div>
          <Button
            type="button" size="sm" className="h-11 gap-2"
            disabled={!selectedEspId || addEsp.isPending}
            onClick={() => void handleAdd()}
          >
            {addEsp.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Agregar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
