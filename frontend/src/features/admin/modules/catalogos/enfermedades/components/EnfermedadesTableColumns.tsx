import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { EnfermedadListItem } from "@api/types";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildEnfermedadesTableColumnsOptions {
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isStatusPending: boolean;
  onOpenDetails: (item: EnfermedadListItem) => void;
  onToggleStatus: (item: EnfermedadListItem) => void;
  onRequestDelete: (item: EnfermedadListItem) => void;
}

export const buildEnfermedadesTableColumns = ({
  canRead,
  canUpdate,
  canDelete,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildEnfermedadesTableColumnsOptions): DataTableColumn<EnfermedadListItem>[] => {
  const baseColumns: DataTableColumn<EnfermedadListItem>[] = [
    {
      key: "name",
      header: "Enfermedad",
      accessorKey: "name",
      className: "w-[320px]",
      cellContentClassName: "max-w-[300px]",
    },
    {
      key: "code",
      header: "Codigo",
      accessorKey: "code",
      className: "w-[140px]",
    },
    {
      key: "cieVersion",
      header: "Version CIE",
      accessorKey: "cieVersion",
      align: "center",
      className: "w-[120px]",
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

  const showActions = canRead || canUpdate || canDelete;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<EnfermedadListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canRead) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdate) {
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

      if (canDelete) {
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

export const buildEnfermedadesVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "name", label: "Enfermedad" },
    { key: "code", label: "Codigo" },
    { key: "cieVersion", label: "Version CIE" },
    { key: "isActive", label: "Estado" },
  ];

  if (showActions) {
    options.push({ key: "actions", label: "Acciones", canHide: false });
  }

  return options;
};
