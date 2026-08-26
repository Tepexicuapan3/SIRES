import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { EstudioMedicoListItem } from "@api/types";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildEstudiosMedicosTableColumnsOptions {
  canReadEstudioMedico: boolean;
  canUpdateEstudioMedico: boolean;
  canDeleteEstudioMedico: boolean;
  isStatusPending: boolean;
  onOpenDetails: (estudioMedico: EstudioMedicoListItem) => void;
  onToggleStatus: (estudioMedico: EstudioMedicoListItem) => void;
  onRequestDelete: (estudioMedico: EstudioMedicoListItem) => void;
}

export const buildEstudiosMedicosTableColumns = ({
  canReadEstudioMedico,
  canUpdateEstudioMedico,
  canDeleteEstudioMedico,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildEstudiosMedicosTableColumnsOptions): DataTableColumn<EstudioMedicoListItem>[] => {
  const baseColumns: DataTableColumn<EstudioMedicoListItem>[] = [
    {
      key: "name",
      header: "Nombre",
      accessorKey: "name",
      className: "w-[260px]",
      cellContentClassName: "max-w-[260px]",
    },
    {
      key: "studyType",
      header: "Tipo de estudio",
      accessorKey: "studyType",
      className: "w-[180px]",
      cellContentClassName: "max-w-[160px]",
    },
    {
      key: "code",
      header: "Valor",
      className: "w-[130px]",
      render: (row) => row.code ?? "-",
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

  const showActions =
    canReadEstudioMedico || canUpdateEstudioMedico || canDeleteEstudioMedico;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<EstudioMedicoListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadEstudioMedico) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdateEstudioMedico) {
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

      if (canDeleteEstudioMedico) {
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

export const buildEstudiosMedicosVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "name", label: "Nombre" },
    { key: "studyType", label: "Tipo de estudio" },
    { key: "code", label: "Valor" },
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
