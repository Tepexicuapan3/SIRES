import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Badge } from "@shared/ui/badge";
import type { CatInsumo } from "@api/types";

interface Props {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onClose:      () => void;
  item:         CatInsumo | null;
}

export function InsumoDetailsDialog({ open, onOpenChange, item }: Props) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item.nombre}</DialogTitle>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Código</dt>
            <dd className="font-mono font-medium">{item.codigo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cód. de barras</dt>
            <dd className="font-mono">{item.codigoBarras || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Categoría</dt>
            <dd>{item.categoriaLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Unidad</dt>
            <dd>{item.unidadLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Stock mínimo</dt>
            <dd>{item.stockMinimo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Estado</dt>
            <dd>
              <Badge variant={item.isActive ? "default" : "outline"}>
                {item.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Control</dt>
            <dd className="flex gap-2 mt-1">
              {item.requiereLote      && <Badge variant="secondary">Requiere lote</Badge>}
              {item.requiereCaducidad && <Badge variant="secondary">Requiere caducidad</Badge>}
              {!item.requiereLote && !item.requiereCaducidad && <span className="text-muted-foreground">Sin control especial</span>}
            </dd>
          </div>
          {item.descripcion && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Descripción</dt>
              <dd>{item.descripcion}</dd>
            </div>
          )}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
