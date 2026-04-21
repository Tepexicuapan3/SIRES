import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { EscuelaListItem } from "@api/types";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildEscuelasTableColumnsOptions {
  canReadEscuela: boolean;
  canUpdateEscuela: boolean;
  canDeleteEscuela: boolean;
  isStatusPending: boolean;
  onOpenDetails: (escuela: EscuelaListItem) => void;
  onToggleStatus: (escuela: EscuelaListItem) => void;
  onRequestDelete: (escuela: EscuelaListItem) => void;
}

export const buildEscuelasTableColumns = ({
  canReadEscuela,
  canUpdateEscuela,
  canDeleteEscuela,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildEscuelasTableColumnsOptions): DataTableColumn<EscuelaListItem>[] => {
  const baseColumns: DataTableColumn<EscuelaListItem>[] = [
    {
      key: "name",
      header: "Escuela",
      accessorKey: "name",
      className: "w-[260px]",
      cellContentClassName: "max-w-[260px]",
    },
    {
      key: "code",
      header: "Siglas",
      accessorKey: "code",
      className: "w-[180px]",
      cellContentClassName: "max-w-[160px]",
    },
    {
      key: "isActive",
      header: "Estado",
      align: "center",
      accessorKey: "isActive",
      className: "w-[130px]",
      render: (row) => (
        <CatalogStatusBadge
          isActive={row.isActive}
          activeLabel="Activa"
          inactiveLabel="Inactiva"
        />
      ),
    },
  ];

  const showActions = canReadEscuela || canUpdateEscuela || canDeleteEscuela;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<EscuelaListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadEscuela) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdateEscuela) {
        actions.push({
          id: `edit-${row.id}`,
          label: "Editar",
          icon: Pencil,
          onSelect: () => onOpenDetails(row),
        });
        actions.push({
          id: `status-${row.id}`,
          label: row.isActive ? "Desactivar" : "Activar",
          icon: row.isActive ? ToggleLeft : ToggleRight,
          disabled: isStatusPending,
          onSelect: () => onToggleStatus(row),
        });
      }

      if (canDeleteEscuela) {
        if (actions.length > 0) {
          actions.push({ id: `divider-${row.id}`, type: "separator" });
        }

        actions.push({
          id: `delete-${row.id}`,
          label: "Eliminar",
          icon: Trash2,
          variant: "destructive",
          onSelect: () => onRequestDelete(row),
        });
      }

      return actions.length > 0 ? (
        <div
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <TableToolbar actions={actions} />
        </div>
      ) : null;
    },
  };

  return [...baseColumns, actionColumn];
};

export const buildEscuelasVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "name", label: "Escuela" },
    { key: "code", label: "Siglas" },
    { key: "isActive", label: "Estado" },
  ];

  if (showActions) {
    options.push({
      key: "actions",
      label: "Acciones",
      canHide: false,
    });
  }

  return options;
};
