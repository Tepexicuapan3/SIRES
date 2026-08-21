import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { EdoCivilListItem } from "@api/types";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildEdoCivilTableColumnsOptions {
  canReadEdoCivil: boolean;
  canUpdateEdoCivil: boolean;
  canDeleteEdoCivil: boolean;
  isStatusPending: boolean;
  onOpenDetails: (edoCivil: EdoCivilListItem) => void;
  onToggleStatus: (edoCivil: EdoCivilListItem) => void;
  onRequestDelete: (edoCivil: EdoCivilListItem) => void;
}

export const buildEdoCivilTableColumns = ({
  canReadEdoCivil,
  canUpdateEdoCivil,
  canDeleteEdoCivil,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildEdoCivilTableColumnsOptions): DataTableColumn<EdoCivilListItem>[] => {
  const baseColumns: DataTableColumn<EdoCivilListItem>[] = [
    {
      key: "name",
      header: "Estado civil",
      accessorKey: "name",
      className: "w-[260px]",
      cellContentClassName: "max-w-[260px]",
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
          activeLabel="Activo"
          inactiveLabel="Inactivo"
        />
      ),
    },
  ];

  const showActions = canReadEdoCivil || canUpdateEdoCivil || canDeleteEdoCivil;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<EdoCivilListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadEdoCivil) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdateEdoCivil) {
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

      if (canDeleteEdoCivil) {
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

export const buildEdoCivilVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "name", label: "Estado civil" },
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
