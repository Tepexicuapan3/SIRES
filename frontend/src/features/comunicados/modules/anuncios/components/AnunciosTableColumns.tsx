import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { AnuncioListItem } from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";
import { formatDate } from "@features/comunicados/modules/anuncios/utils/anuncios.format";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { type DataTableColumn } from "@features/admin/shared/components/DataTable";
import { type TableColumnVisibilityItem } from "@features/admin/shared/components/TableColumnVisibility";
import {
  TableActionsHeader,
  TableToolbar,
  type TableAction,
} from "@features/admin/shared/components/TableToolbar";

interface BuildAnunciosTableColumnsOptions {
  canReadAnuncio: boolean;
  canUpdateAnuncio: boolean;
  canDeleteAnuncio: boolean;
  isStatusPending: boolean;
  onOpenDetails: (anuncio: AnuncioListItem) => void;
  onToggleStatus: (anuncio: AnuncioListItem) => void;
  onRequestDelete: (anuncio: AnuncioListItem) => void;
}

export const buildAnunciosTableColumns = ({
  canReadAnuncio,
  canUpdateAnuncio,
  canDeleteAnuncio,
  isStatusPending,
  onOpenDetails,
  onToggleStatus,
  onRequestDelete,
}: BuildAnunciosTableColumnsOptions): DataTableColumn<AnuncioListItem>[] => {
  const baseColumns: DataTableColumn<AnuncioListItem>[] = [
    {
      key: "imagenUrl",
      header: "Imagen",
      align: "center",
      className: "w-[80px]",
      render: (row) => (
        <img
          src={row.imagenUrl}
          alt=""
          className="mx-auto size-10 rounded-lg object-cover"
        />
      ),
    },
    {
      key: "titulo",
      header: "Anuncio",
      accessorKey: "titulo",
      className: "w-[280px]",
      cellContentClassName: "max-w-[280px]",
    },
    {
      key: "vigencia",
      header: "Vigencia",
      render: (row) =>
        `${formatDate(row.vigenciaDesde)} — ${row.vigenciaHasta ? formatDate(row.vigenciaHasta) : "Indefinida"}`,
    },
    {
      key: "orden",
      header: "Orden",
      align: "center",
      accessorKey: "orden",
      className: "w-[90px]",
      truncate: false,
    },
    {
      key: "activo",
      header: "Estado",
      align: "center",
      accessorKey: "activo",
      className: "w-[130px]",
      render: (row) => (
        <CatalogStatusBadge
          isActive={row.activo}
          activeLabel="Activo"
          inactiveLabel="Inactivo"
        />
      ),
    },
  ];

  const showActions = canReadAnuncio || canUpdateAnuncio || canDeleteAnuncio;

  if (!showActions) {
    return baseColumns;
  }

  const actionColumn: DataTableColumn<AnuncioListItem> = {
    key: "actions",
    header: <TableActionsHeader />,
    align: "center",
    className: "w-9 px-0",
    headerClassName: "w-9 px-0",
    render: (row) => {
      const actions: TableAction[] = [];

      if (canReadAnuncio) {
        actions.push({
          id: `view-${row.id}`,
          label: "Ver detalles",
          icon: Eye,
          onSelect: () => onOpenDetails(row),
        });
      }

      if (canUpdateAnuncio) {
        actions.push({
          id: `edit-${row.id}`,
          label: "Editar",
          icon: Pencil,
          onSelect: () => onOpenDetails(row),
        });
        actions.push({
          id: `status-${row.id}`,
          label: row.activo ? "Desactivar" : "Activar",
          icon: row.activo ? ToggleLeft : ToggleRight,
          disabled: isStatusPending,
          onSelect: () => onToggleStatus(row),
        });
      }

      if (canDeleteAnuncio) {
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

export const buildAnunciosVisibilityOptions = (
  showActions: boolean,
): TableColumnVisibilityItem[] => {
  const options: TableColumnVisibilityItem[] = [
    { key: "imagenUrl", label: "Imagen" },
    { key: "titulo", label: "Anuncio" },
    { key: "vigencia", label: "Vigencia" },
    { key: "orden", label: "Orden" },
    { key: "activo", label: "Estado" },
  ];

  if (showActions) {
    options.push({ key: "actions", label: "Acciones", canHide: false });
  }

  return options;
};
