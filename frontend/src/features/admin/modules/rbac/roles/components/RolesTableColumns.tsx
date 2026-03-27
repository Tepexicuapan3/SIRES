import { Eye, Trash2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import type { RoleListItem } from "@api/types";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildRolesTableColumnsOptions {
  canReadRole: boolean;
  canUpdateRole: boolean;
  canDeleteRole: boolean;
  onOpenDetails: (role: RoleListItem) => void;
  onRequestDelete: (role: RoleListItem) => void;
}

export const buildRolesTableColumns = ({
  canReadRole,
  canUpdateRole,
  canDeleteRole,
  onOpenDetails,
  onRequestDelete,
}: BuildRolesTableColumnsOptions): DataTableColumn<RoleListItem>[] => {
  const baseColumns: DataTableColumn<RoleListItem>[] = [
    {
      key: "name",
      header: "Rol",
      accessorKey: "name",
      className: "w-[200px]",
      cellContentClassName: "max-w-[190px]",
    },
    {
      key: "description",
      header: "Descripción",
      accessorKey: "description",
      className: "w-[300px]",
      cellContentClassName: "max-w-[280px]",
    },
    {
      key: "permissionsCount",
      header: "Permisos",
      align: "center",
      accessorKey: "permissionsCount",
      className: "w-[108px]",
    },
    {
      key: "usersCount",
      header: "Usuarios",
      align: "center",
      accessorKey: "usersCount",
      className: "w-[108px]",
    },
    {
      key: "isSystem",
      header: "Tipo",
      align: "center",
      accessorKey: "isSystem",
      className: "w-[118px]",
      render: (row) =>
        row.isSystem ? (
          <Badge variant="outline">Sistema</Badge>
        ) : (
          <Badge variant="secondary">Custom</Badge>
        ),
    },
    {
      key: "isActive",
      header: "Estado",
      align: "center",
      accessorKey: "isActive",
      className: "w-[118px]",
      render: (row) =>
        row.isActive ? (
          <Badge variant="stable">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
  ];

  const canOpenDetails = canReadRole || canUpdateRole;
  const showActions = canOpenDetails || canDeleteRole;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<RoleListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-12 px-0",
    headerClassName: "w-12 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canOpenDetails) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canDeleteRole) {
        if (actions.length > 0) {
          actions.push({ id: `divider-${row.id}`, type: "separator" });
        }
        actions.push({
          id: `delete-${row.id}`,
          label: "Eliminar",
          icon: Trash2,
          disabled: row.isSystem,
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

export const buildRolesVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "name", label: "Rol" },
    { key: "description", label: "Descripción" },
    { key: "permissionsCount", label: "Permisos" },
    { key: "usersCount", label: "Usuarios" },
    { key: "isSystem", label: "Tipo" },
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
