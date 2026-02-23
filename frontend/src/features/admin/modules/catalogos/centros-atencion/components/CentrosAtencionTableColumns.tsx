import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CentroAtencionListItem } from "@api/types";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildCentrosAtencionTableColumnsOptions {
  canReadCenter: boolean;
  canUpdateCenter: boolean;
  canDeleteCenter: boolean;
  isStatusPending: boolean;
  onOpenDetails: (center: CentroAtencionListItem) => void;
  onToggleStatus: (center: CentroAtencionListItem) => void;
  onRequestDelete: (center: CentroAtencionListItem) => void;
}

export const buildCentrosAtencionTableColumns = ({
  canReadCenter,
  canUpdateCenter,
  canDeleteCenter,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildCentrosAtencionTableColumnsOptions): DataTableColumn<CentroAtencionListItem>[] => {
  const baseColumns: DataTableColumn<CentroAtencionListItem>[] = [
    {
      key: "name",
      header: "Centro",
      accessorKey: "name",
      className: "w-[280px]",
      cellContentClassName: "max-w-[260px]",
    },
    {
      key: "folioCode",
      header: "Folio",
      accessorKey: "folioCode",
      className: "w-[150px]",
      cellContentClassName: "max-w-[120px]",
    },
    {
      key: "isExternal",
      header: "Tipo",
      align: "center",
      accessorKey: "isExternal",
      className: "w-[130px]",
      render: (row) =>
        row.isExternal ? (
          <Badge variant="secondary">Externo</Badge>
        ) : (
          <Badge variant="outline">Interno</Badge>
        ),
    },
    {
      key: "isActive",
      header: "Estado",
      align: "center",
      accessorKey: "isActive",
      className: "w-[130px]",
      render: (row) => <CatalogStatusBadge isActive={row.isActive} />,
    },
  ];

  const showActions = canReadCenter || canUpdateCenter || canDeleteCenter;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<CentroAtencionListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadCenter) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdateCenter) {
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

      if (canDeleteCenter) {
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

export const buildCentrosAtencionVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "name", label: "Centro" },
    { key: "folioCode", label: "Folio" },
    { key: "isExternal", label: "Tipo" },
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
