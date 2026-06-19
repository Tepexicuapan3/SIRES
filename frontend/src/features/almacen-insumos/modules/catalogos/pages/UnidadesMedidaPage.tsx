import { useState } from "react";
import { toast } from "sonner";
import { Ruler, Plus, RotateCcw, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import type { DataTableColumn } from "@features/admin/shared/components/DataTable";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { TableFilterMenu } from "@features/admin/shared/components/TableFilterMenu";
import { TableColumnVisibility, type ColumnVisibilityState } from "@features/admin/shared/components/TableColumnVisibility";
import { TableToolbar, TableActionsHeader, type TableAction } from "@features/admin/shared/components/TableToolbar";
import { ConfirmDestructiveDialog } from "@features/admin/shared/components/ConfirmDestructiveDialog";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import type { CatUnidadMedida } from "@api/types";
import { useUnidadesMedidaList } from "../queries/useCatalogosQueries";
import { useCreateUnidadMedida, useUpdateUnidadMedida, useDeleteUnidadMedida } from "../mutations/useCatalogosMutations";
import { getCatalogErrorMessage } from "../utils/catalogos.feedback";

const STATUS_FILTER = { ALL: "all", ACTIVE: "active", INACTIVE: "inactive" } as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function UnidadesMedidaPage() {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER.ALL);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    nombre: true, abreviacion: true, isActive: true, actions: true,
  });
  const [createOpen, setCreateOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatUnidadMedida | null>(null);
  const [editingItem, setEditingItem]   = useState<CatUnidadMedida | null>(null);
  const [nombre, setNombre]             = useState("");
  const [abreviacion, setAbreviacion]   = useState("");
  const [isActive, setIsActive]         = useState(true);

  const debouncedSearch = useDebounce(search, 400);
  const createUnidad    = useCreateUnidadMedida();
  const updateUnidad    = useUpdateUnidadMedida();
  const deleteUnidad    = useDeleteUnidadMedida();

  const { data, isLoading, isFetching, error, refetch } = useUnidadesMedidaList({
    page, pageSize,
    search: debouncedSearch.trim() || undefined,
    includeInactive: statusFilter !== STATUS_FILTER.ACTIVE,
  });

  const allRows = data?.items ?? [];
  const rows = statusFilter === STATUS_FILTER.INACTIVE
    ? allRows.filter((r) => !r.isActive)
    : allRows;

  const handleOpenCreate = () => {
    setEditingItem(null);
    setNombre(""); setAbreviacion(""); setIsActive(true);
    setCreateOpen(true);
  };

  const handleOpenEdit = (item: CatUnidadMedida) => {
    setEditingItem(item);
    setNombre(item.nombre); setAbreviacion(item.abreviacion); setIsActive(item.isActive);
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !abreviacion.trim()) return;
    try {
      if (editingItem) {
        await updateUnidad.mutateAsync({ id: editingItem.id, data: { nombre: nombre.trim(), abreviacion: abreviacion.trim(), isActive } });
        toast.success("Unidad actualizada");
      } else {
        await createUnidad.mutateAsync({ nombre: nombre.trim(), abreviacion: abreviacion.trim() });
        toast.success("Unidad creada");
      }
      setNombre(""); setAbreviacion(""); setIsActive(true); setCreateOpen(false); setEditingItem(null);
    } catch (err) {
      toast.error(editingItem ? "Error al actualizar" : "Error al crear", { description: getCatalogErrorMessage(err, "Verifica los datos") });
    }
  };

  const handleToggleStatus = async (item: CatUnidadMedida) => {
    try {
      await updateUnidad.mutateAsync({ id: item.id, data: { isActive: !item.isActive } });
      toast.success(item.isActive ? "Unidad desactivada" : "Unidad activada");
    } catch (err) {
      toast.error("No se pudo actualizar el estado", { description: getCatalogErrorMessage(err, "Intenta nuevamente") });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteUnidad.mutateAsync(itemToDelete.id);
      toast.success("Unidad eliminada");
      setDeleteOpen(false); setItemToDelete(null);
    } catch (err) {
      toast.error("No se pudo eliminar", { description: getCatalogErrorMessage(err, "Error al eliminar") });
    }
  };

  const handleClearFilters = () => { setSearch(""); setStatusFilter(STATUS_FILTER.ALL); setPage(1); };

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(Boolean).length;
  const isStatusPending     = updateUnidad.isPending;

  const allColumns: DataTableColumn<CatUnidadMedida>[] = [
    {
      key: "nombre", header: "Nombre",
      render: (row) => <span className="font-medium">{row.nombre}</span>,
    },
    {
      key: "abreviacion", header: "Abreviación", className: "w-32",
      render: (row) => <span className="font-mono">{row.abreviacion}</span>,
    },
    {
      key: "isActive", header: "Estado", className: "w-28",
      render: (row) => <CatalogStatusBadge isActive={row.isActive} activeLabel="Activa" inactiveLabel="Inactiva" />,
    },
    {
      key: "actions",
      header: <TableActionsHeader />,
      align: "center",
      className: "w-9 px-0",
      headerClassName: "w-9 px-0",
      render: (row) => {
        const actions: TableAction[] = [
          { id: `edit-${row.id}`, label: "Editar", icon: Pencil, onSelect: () => handleOpenEdit(row) },
          { id: `status-${row.id}`, label: row.isActive ? "Desactivar" : "Activar",
            icon: row.isActive ? ToggleLeft : ToggleRight, disabled: isStatusPending,
            onSelect: () => { void handleToggleStatus(row); } },
          { id: `div-${row.id}`, type: "separator" },
          { id: `delete-${row.id}`, label: "Eliminar", icon: Trash2, variant: "destructive",
            onSelect: () => { setItemToDelete(row); setDeleteOpen(true); } },
        ];
        return (
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <TableToolbar actions={actions} />
          </div>
        );
      },
    },
  ];

  const visibleColumns = allColumns.filter((col) => columnVisibility[col.key] ?? true);

  const visibilityOptions = [
    { key: "nombre",      label: "Nombre",      canHide: false },
    { key: "abreviacion", label: "Abreviación" },
    { key: "isActive",    label: "Estado" },
    { key: "actions",     label: "Acciones",    canHide: false },
  ];

  const tableOptions: TableOptionItem[] = [
    { id: "refresh", label: "Actualizar", icon: RotateCcw, isLoading: isFetching,
      disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); } },
  ];

  const filterSections = [
    {
      id: "status", label: "Estado",
      options: [
        { id: STATUS_FILTER.ACTIVE, label: "Activas", selected: statusFilter === STATUS_FILTER.ACTIVE,
          onSelect: () => { setStatusFilter(STATUS_FILTER.ACTIVE); setPage(1); } },
        { id: STATUS_FILTER.INACTIVE, label: "Inactivas", selected: statusFilter === STATUS_FILTER.INACTIVE,
          onSelect: () => { setStatusFilter(STATUS_FILTER.INACTIVE); setPage(1); } },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Unidades de Medida"
      description="Catálogo de unidades para el control de insumos."
      icon={<Ruler className="size-12" />}
    >
      <TableHeaderBar
        search={<TableSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar unidad" />}
        actions={
          <>
            <TableFilterMenu sections={filterSections} appliedCount={appliedFiltersCount} onClear={handleClearFilters} />
            <TableColumnVisibility columns={visibilityOptions} visibility={columnVisibility} onVisibilityChange={setColumnVisibility} />
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction permission="almacen:unidades:create" label="Nueva unidad"
              icon={<Plus className="size-4" />} onClick={handleOpenCreate} />
          </>
        }
      />

      <DataTable
        columns={visibleColumns}
        rows={rows}
        onRowClick={handleOpenEdit}
        isLoading={isLoading || search.trim() !== debouncedSearch.trim()}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar unidades"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0}
        onRetry={() => { void refetch(); }}
        onClearFilters={handleClearFilters}
        pagination={{ page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); } }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin unidades de medida"
        emptyDescription="Ej: Pieza (pza), Caja (cja), Mililitro (ml)."
      />

      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setEditingItem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingItem ? "Editar unidad de medida" : "Nueva unidad de medida"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Pieza" />
            </div>
            <div className="space-y-1">
              <Label>Abreviación *</Label>
              <Input value={abreviacion} onChange={(e) => setAbreviacion(e.target.value)} placeholder="Ej: pza" />
            </div>
          </div>
          {editingItem && (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label className="cursor-pointer">Estado</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{isActive ? "Activa" : "Inactiva"}</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => { void handleSave(); }}
              disabled={createUnidad.isPending || updateUnidad.isPending || !nombre.trim() || !abreviacion.trim()}>
              {(createUnidad.isPending || updateUnidad.isPending) ? "Guardando..." : editingItem ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(v) => { setDeleteOpen(v); if (!v) setItemToDelete(null); }}
        title="Eliminar unidad"
        description={`Se eliminará "${itemToDelete?.nombre}".`}
        onConfirm={() => { void handleDelete(); }}
        confirmDisabled={deleteUnidad.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default UnidadesMedidaPage;
