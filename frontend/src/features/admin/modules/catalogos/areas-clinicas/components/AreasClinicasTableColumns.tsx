import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { AreaClinicaListItem } from "@api/types";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildAreasClinicasTableColumnsOptions {
  canReadAreaClinica: boolean;
  canUpdateAreaClinica: boolean;
  canDeleteAreaClinica: boolean;
  isStatusPending: boolean;
  onOpenDetails: (area: AreaClinicaListItem) => void;
  onToggleStatus: (area: AreaClinicaListItem) => void;
  onRequestDelete: (area: AreaClinicaListItem) => void;
}

export const buildAreasClinicasTableColumns = ({
  canReadAreaClinica,
  canUpdateAreaClinica,
  canDeleteAreaClinica,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildAreasClinicasTableColumnsOptions): DataTableColumn<AreaClinicaListItem>[] => {
  const baseColumns: DataTableColumn<AreaClinicaListItem>[] = [
    {
      key: "name",
      header: "Área clínica",
      accessorKey: "name",
      className: "w-[400px]",
      cellContentClassName: "max-w-[380px]",
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

  const showActions = canReadAreaClinica || canUpdateAreaClinica || canDeleteAreaClinica;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<AreaClinicaListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadAreaClinica) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdateAreaClinica) {
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

      if (canDeleteAreaClinica) {
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

export const buildAreasClinicasVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "name", label: "Área clínica" },
    { key: "isActive", label: "Estado" },
  ];

  if (showActions) {
    options.push({ key: "actions", label: "Acciones", canHide: false });
  }

  return options;
};
