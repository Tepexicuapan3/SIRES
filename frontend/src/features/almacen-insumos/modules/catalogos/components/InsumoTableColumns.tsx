import { Badge } from "@shared/ui/badge";
import { Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@features/admin/shared/components/DataTable";
import type { TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import { TableToolbar, TableActionsHeader, type TableAction } from "@features/admin/shared/components/TableToolbar";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import type { CatInsumo } from "@api/types";

interface BuildInsumoTableColumnsOptions {
  isStatusPending: boolean;
  onOpenEdit:       (insumo: CatInsumo) => void;
  onToggleStatus:   (insumo: CatInsumo) => void;
  onRequestDelete:  (insumo: CatInsumo) => void;
}

export function buildInsumoTableColumns({
  isStatusPending,
  onOpenEdit,
  onToggleStatus,
  onRequestDelete,
}: BuildInsumoTableColumnsOptions): DataTableColumn<CatInsumo>[] {
  return [
    {
      key:    "codigo",
      header: "Código",
      className: "w-28",
      render: (row) => <span className="font-mono text-xs">{row.codigo}</span>,
    },
    {
      key:    "nombre",
      header: "Nombre",
      render: (row) => <span className="font-medium">{row.nombre}</span>,
    },
    {
      key:    "categoriaLabel",
      header: "Categoría",
      render: (row) => row.categoriaLabel,
    },
    {
      key:    "unidadLabel",
      header: "Unidad",
      className: "w-32",
      render: (row) => row.unidadLabel,
    },
    {
      key:    "codigoBarras",
      header: "Código de barras",
      className: "w-40",
      render: (row) => row.codigoBarras
        ? <span className="font-mono text-xs">{row.codigoBarras}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key:    "flags",
      header: "Control",
      className: "w-36",
      render: (row) => (
        <div className="flex gap-1 flex-wrap">
          {row.requiereLote      && <Badge variant="secondary">Lote</Badge>}
          {row.requiereCaducidad && <Badge variant="secondary">Caducidad</Badge>}
        </div>
      ),
    },
    {
      key:    "isActive",
      header: "Estado",
      className: "w-28",
      render: (row) => <CatalogStatusBadge isActive={row.isActive} />,
    },
    {
      key: "actions",
      header: <TableActionsHeader />,
      align: "center",
      className: "w-9 px-0",
      headerClassName: "w-9 px-0",
      render: (row) => {
        const actions: TableAction[] = [
          { id: `edit-${row.id}`, label: "Editar", icon: Pencil, onSelect: () => onOpenEdit(row) },
          { id: `status-${row.id}`, label: row.isActive ? "Desactivar" : "Activar",
            icon: row.isActive ? ToggleLeft : ToggleRight, disabled: isStatusPending,
            onSelect: () => onToggleStatus(row) },
          { id: `div-${row.id}`, type: "separator" },
          { id: `delete-${row.id}`, label: "Eliminar", icon: Trash2, variant: "destructive",
            onSelect: () => onRequestDelete(row) },
        ];
        return (
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <TableToolbar actions={actions} />
          </div>
        );
      },
    },
  ];
}

export function buildInsumoVisibilityOptions(): TableColumnVisibilityItem[] {
  return [
    { key: "codigo",        label: "Código",           canHide: false },
    { key: "nombre",        label: "Nombre",           canHide: false },
    { key: "categoriaLabel",label: "Categoría" },
    { key: "unidadLabel",   label: "Unidad" },
    { key: "codigoBarras",  label: "Código de barras" },
    { key: "flags",         label: "Control" },
    { key: "isActive",      label: "Estado" },
    { key: "actions",       label: "Acciones",         canHide: false },
  ];
}
