import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { InventarioVacunaListItem } from "@api/types";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildColumnsOptions {
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isStatusPending: boolean;
  onOpenDetails: (item: InventarioVacunaListItem) => void;
  onToggleStatus: (item: InventarioVacunaListItem) => void;
  onRequestDelete: (item: InventarioVacunaListItem) => void;
}

export const buildInventarioTableColumns = ({
  canRead,
  canUpdate,
  canDelete,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildColumnsOptions): DataTableColumn<InventarioVacunaListItem>[] => {
  const baseColumns: DataTableColumn<InventarioVacunaListItem>[] = [
    {
      key: "vaccine",
      header: "Vacuna",
      accessorKey: "vaccine",
      className: "w-[200px]",
      cellContentClassName: "max-w-[180px]",
      render: (row) => row.vaccine.name,
    },
    {
      key: "center",
      header: "Centro de atención",
      accessorKey: "center",
      className: "w-[220px]",
      cellContentClassName: "max-w-[200px]",
      render: (row) => row.center.name,
    },
    {
      key: "stockQuantity",
      header: "Inventario",
      align: "center",
      accessorKey: "stockQuantity",
      className: "w-[100px]",
      render: (row) => <span className="tabular-nums">{row.stockQuantity}</span>,
    },
    {
      key: "appliedDoses",
      header: "Dosis Aplicadas",
      align: "center",
      accessorKey: "appliedDoses",
      className: "w-[100px]",
      render: (row) => <span className="tabular-nums">{row.appliedDoses}</span>,
    },
    {
      key: "availableDoses",
      header: "Existencia",
      align: "center",
      accessorKey: "availableDoses",
      className: "w-[110px]",
      render: (row) => (
        <span
          className={
            row.availableDoses === 0
              ? "font-semibold tabular-nums text-status-critical"
              : row.availableDoses <= Math.round(row.stockQuantity * 0.2)
                ? "font-semibold tabular-nums text-status-warning"
                : "tabular-nums"
          }
        >
          {row.availableDoses}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      align: "center",
      accessorKey: "isActive",
      className: "w-[110px]",
      render: (row) => <CatalogStatusBadge isActive={row.isActive} />,
    },
  ];

  const showActions = canRead || canUpdate || canDelete;
  if (!showActions) return baseColumns;

  const actionColumn: DataTableColumn<InventarioVacunaListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canRead) {
        actions.push({ id: `view-${row.id}`, label: "Ver detalles", icon: Eye, onSelect: () => onOpenDetails(row) });
      }

      if (canUpdate) {
        actions.push({ id: `edit-${row.id}`, label: "Editar", icon: Pencil, onSelect: () => onOpenDetails(row) });
        actions.push({
          id: `status-${row.id}`,
          label: row.isActive ? "Desactivar" : "Activar",
          icon: row.isActive ? ToggleLeft : ToggleRight,
          disabled: isStatusPending,
          onSelect: () => onToggleStatus(row),
        });
      }

      if (canDelete) {
        if (actions.length > 0) actions.push({ id: `sep-${row.id}`, type: "separator" });
        actions.push({ id: `del-${row.id}`, label: "Eliminar", icon: Trash2, variant: "destructive", onSelect: () => onRequestDelete(row) });
      }

      return actions.length > 0 ? (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <TableToolbar actions={actions} />
        </div>
      ) : null;
    },
  };

  return [...baseColumns, actionColumn];
};

export const buildInventarioVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "vaccine", label: "Vacuna" },
    { key: "center", label: "Centro" },
    { key: "stockQuantity", label: "Existencia" },
    { key: "appliedDoses", label: "Aplicadas" },
    { key: "availableDoses", label: "Disponibles" },
    { key: "isActive", label: "Estado" },
  ];

  if (showActions) options.push({ key: "actions", label: "Acciones", canHide: false });
  return options;
};
