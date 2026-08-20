import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { ConfirmDestructiveDialog } from "@features/admin/shared/components/ConfirmDestructiveDialog";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { ConsultorioCreateDialog } from "@features/admin/modules/catalogos/consultorios/components/ConsultorioCreateDialog";
import { ConsultorioDetailsDialog } from "@features/admin/modules/catalogos/consultorios/components/ConsultorioDetailsDialog";
import { useConsultoriosList } from "@features/admin/modules/catalogos/consultorios/queries/useConsultoriosList";
import { useDeleteConsultorio } from "@features/admin/modules/catalogos/consultorios/mutations/useDeleteConsultorio";
import { getConsultorioErrorMessage } from "@features/admin/modules/catalogos/consultorios/utils/consultorios.feedback";
import type { ConsultorioListItem } from "@api/types";

interface Props {
  centerId: number;
  canEdit: boolean;
}

export function CentroAtencionDetailsConsultoriosSection({
  centerId,
  canEdit,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [consultorioToDelete, setConsultorioToDelete] =
    useState<ConsultorioListItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedConsultorio, setSelectedConsultorio] =
    useState<ConsultorioListItem | null>(null);

  const { data, isLoading } = useConsultoriosList(
    { idCenter: centerId, pageSize: 100 },
    { enabled: Boolean(centerId) },
  );

  const deleteConsultorio = useDeleteConsultorio();

  const consultorios = data?.items ?? [];

  const openDetails = (consultorio: ConsultorioListItem) => {
    setSelectedConsultorio(consultorio);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedConsultorio(null);
  };

  const handleDelete = async () => {
    if (!consultorioToDelete) return;

    try {
      await deleteConsultorio.mutateAsync({
        consultorioId: consultorioToDelete.id,
      });
      toast.success("Consultorio eliminado", {
        description: `El consultorio ${consultorioToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setConsultorioToDelete(null);
    } catch (error) {
      toast.error("No se pudo eliminar", {
        description: getConsultorioErrorMessage(
          error,
          "Error al eliminar consultorio",
        ),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-txt-muted">
          {consultorios.length} consultorio
          {consultorios.length !== 1 ? "s" : ""} registrado
          {consultorios.length !== 1 ? "s" : ""}
        </p>
        {canEdit && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nuevo consultorio
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : consultorios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-struct p-8 text-center">
          <p className="text-sm text-txt-muted">
            Sin consultorios registrados para este centro.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line-struct">
          <div className="divide-y divide-line-struct">
            {consultorios.map((consultorio) => (
              <button
                key={consultorio.id}
                type="button"
                onClick={() => openDetails(consultorio)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-surface-subtle"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-txt-body">
                    {consultorio.name}
                  </span>
                  <Badge variant="outline">No. {consultorio.numero}</Badge>
                  {consultorio.turnName ? (
                    <span className="text-xs text-txt-muted">
                      {consultorio.turnName}
                    </span>
                  ) : null}
                  <CatalogStatusBadge isActive={consultorio.isActive} />
                </div>

                <div className="flex items-center gap-1">
                  <span className="rounded-md p-2 text-txt-muted">
                    <Pencil className="size-4" />
                  </span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConsultorioToDelete(consultorio);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="size-4 text-status-critical" />
                    </Button>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <ConsultorioDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={closeDetails}
        consultorioSummary={selectedConsultorio}
        canEdit={canEdit}
      />

      {canEdit && (
        <ConsultorioCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          centerId={centerId}
        />
      )}

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setConsultorioToDelete(null);
          }
        }}
        title="Eliminar consultorio"
        description="Esta accion dara de baja el consultorio y lo quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteConsultorio.isPending}
      />
    </div>
  );
}
