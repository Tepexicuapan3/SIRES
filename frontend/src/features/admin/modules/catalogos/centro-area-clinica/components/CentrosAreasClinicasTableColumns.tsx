import { Eye, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { CentroAreaClinicaListItem } from "@api/types";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildCentrosAreasClinicasTableColumnsOptions {
  canReadCentroAreaClinica: boolean;
  canUpdateCentroAreaClinica: boolean;
  canDeleteCentroAreaClinica: boolean;
  isStatusPending: boolean;
  onOpenDetails: (item: CentroAreaClinicaListItem) => void;
  onToggleStatus: (item: CentroAreaClinicaListItem) => void;
  onRequestDelete: (item: CentroAreaClinicaListItem) => void;
}

export const buildCentrosAreasClinicasTableColumns = ({
  canReadCentroAreaClinica,
  canUpdateCentroAreaClinica,
  canDeleteCentroAreaClinica,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildCentrosAreasClinicasTableColumnsOptions): DataTableColumn<CentroAreaClinicaListItem>[] => {
  const baseColumns: DataTableColumn<CentroAreaClinicaListItem>[] = [
    {
      key: "center",
      header: "Centro de atención",
      className: "w-[300px]",
      cellContentClassName: "max-w-[280px]",
      render: (row) => row.center.name,
    },
    {
      key: "areaClinica",
      header: "Área clínica",
      className: "w-[300px]",
      cellContentClassName: "max-w-[280px]",
      render: (row) => row.areaClinica.name,
    },
    {
      key: "isActive",
      header: "Estado",
      align: "center",
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

  const showActions =
    canReadCentroAreaClinica || canUpdateCentroAreaClinica || canDeleteCentroAreaClinica;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<CentroAreaClinicaListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const rowKey = `${row.center.id}-${row.areaClinica.id}`;
      const actions: TableAction[] = [];

      if (canReadCentroAreaClinica) {
        actions.push({
          id: `view-${rowKey}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdateCentroAreaClinica) {
        actions.push({
          id: `status-${rowKey}`,
          label: row.isActive ? "Desactivar" : "Activar",
          icon: row.isActive ? ToggleLeft : ToggleRight,
          disabled: isStatusPending,
          onSelect: () => onToggleStatus(row),
        });
      }

      if (canDeleteCentroAreaClinica) {
        if (actions.length > 0) {
          actions.push({ id: `divider-${rowKey}`, type: "separator" });
        }
        actions.push({
          id: `delete-${rowKey}`,
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

export const buildCentrosAreasClinicasVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "center", label: "Centro de atención" },
    { key: "areaClinica", label: "Área clínica" },
    { key: "isActive", label: "Estado" },
  ];

  if (showActions) {
    options.push({ key: "actions", label: "Acciones", canHide: false });
  }

  return options;
};
