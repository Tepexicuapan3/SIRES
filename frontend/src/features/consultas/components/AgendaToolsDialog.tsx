import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgendaToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AgendaToolsDialog = ({
  open,
  onOpenChange,
}: AgendaToolsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-brand" />
            Filtros y acciones
          </DialogTitle>
          <DialogDescription>
            Ajusta la agenda sin saturar la vista principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agenda-status">Estado</Label>
              <Input
                id="agenda-status"
                placeholder="confirmada, pendiente..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-medico">Medico</Label>
              <Input id="agenda-medico" placeholder="Filtrar por medico" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agenda-desde">Desde</Label>
              <Input id="agenda-desde" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-hasta">Hasta</Label>
              <Input id="agenda-hasta" type="date" />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-line-struct bg-subtle p-3">
            <p className="text-sm font-medium text-txt-body">
              Acciones avanzadas
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              <Button variant="outline" size="sm" type="button">
                Reasignar
              </Button>
              <Button variant="outline" size="sm" type="button">
                Bloquear horario
              </Button>
              <Button variant="outline" size="sm" type="button">
                Exportar dia
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button">Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
