import { useState } from "react";
import { toast } from "sonner";
import { Warehouse, Plus, RotateCcw, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
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
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { Textarea } from "@shared/ui/textarea";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import type { Almacen, AlmacenTipo } from "@api/types";
import { ALMACEN_TIPO, ALMACEN_TIPO_LABELS } from "@api/types";
import { useAlmacenesList } from "../queries/useCatalogosQueries";
import { useCreateAlmacen, useUpdateAlmacen, useDeleteAlmacen } from "../mutations/useCatalogosMutations";
import { getCatalogErrorMessage } from "../utils/catalogos.feedback";

const STATUS_FILTER = { ALL: "all", ACTIVE: "active", INACTIVE: "inactive" } as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function AlmacenesPage() {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER.ALL);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    nombre: true, tipoLabel: true, centroLabel: true, descripcion: true, isActive: true, actions: true,
  });
  const [createOpen, setCreateOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Almacen | null>(null);
  const [editingItem, setEditingItem]   = useState<Almacen | null>(null);
  const [form, setForm] = useState({
    nombre: "", tipo: ALMACEN_TIPO.GENERAL as AlmacenTipo,
    idCentroAtencion: "", descripcion: "", isActive: true,
  });

  const debouncedSearch = useDebounce(search, 400);
  const createAlmacen   = useCreateAlmacen();
  const updateAlmacen   = useUpdateAlmacen();
  const deleteAlmacen   = useDeleteAlmacen();

  const { data, isLoading, isFetching, error, refetch } = useAlmacenesList({
    page, pageSize,
    search: debouncedSearch.trim() || undefined,
    includeInactive: statusFilter !== STATUS_FILTER.ACTIVE,
  });

  const { data: centrosData } = useCentrosAtencionList(
    { pageSize: 200, isActive: true },
    { enabled: createOpen },
  );

  const allRows = data?.items ?? [];
  const rows = statusFilter === STATUS_FILTER.INACTIVE
    ? allRows.filter((r) => !r.isActive)
    : allRows;

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({ nombre: "", tipo: ALMACEN_TIPO.GENERAL, idCentroAtencion: "", descripcion: "", isActive: true });
    setCreateOpen(true);
  };

  const handleOpenEdit = (item: Almacen) => {
    setEditingItem(item);
    setForm({
      nombre: item.nombre, tipo: item.tipo,
      idCentroAtencion: String(item.idCentroAtencion), descripcion: item.descripcion ?? "",
      isActive: item.isActive,
    });
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.idCentroAtencion) return;
    const payload = {
      nombre: form.nombre.trim(), tipo: form.tipo,
      idCentroAtencion: Number(form.idCentroAtencion),
      descripcion: form.descripcion || undefined,
    };
    try {
      if (editingItem) {
        await updateAlmacen.mutateAsync({ id: editingItem.id, data: { ...payload, isActive: form.isActive } });
        toast.success("Almacén actualizado");
      } else {
        await createAlmacen.mutateAsync(payload);
        toast.success("Almacén creado");
      }
      setForm({ nombre: "", tipo: ALMACEN_TIPO.GENERAL, idCentroAtencion: "", descripcion: "", isActive: true });
      setCreateOpen(false); setEditingItem(null);
    } catch (err) {
      toast.error(editingItem ? "Error al actualizar" : "Error al crear", { description: getCatalogErrorMessage(err, "Verifica los datos") });
    }
  };

  const handleToggleStatus = async (item: Almacen) => {
    try {
      await updateAlmacen.mutateAsync({ id: item.id, data: { isActive: !item.isActive } });
      toast.success(item.isActive ? "Almacén desactivado" : "Almacén activado");
    } catch (err) {
      toast.error("No se pudo actualizar el estado", { description: getCatalogErrorMessage(err, "Intenta nuevamente") });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteAlmacen.mutateAsync(itemToDelete.id);
      toast.success("Almacén eliminado");
      setDeleteOpen(false); setItemToDelete(null);
    } catch (err) {
      toast.error("No se pudo eliminar", { description: getCatalogErrorMessage(err, "Error al eliminar") });
    }
  };

  const handleClearFilters = () => { setSearch(""); setStatusFilter(STATUS_FILTER.ALL); setPage(1); };

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(Boolean).length;
  const isStatusPending     = updateAlmacen.isPending;

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const allColumns: DataTableColumn<Almacen>[] = [
    {
      key: "nombre", header: "Nombre",
      render: (row) => <span className="font-medium">{row.nombre}</span>,
    },
    {
      key: "tipoLabel", header: "Tipo", className: "w-32",
      render: (row) => <Badge variant="secondary">{row.tipoLabel}</Badge>,
    },
    {
      key: "centroLabel", header: "Centro de atención",
      render: (row) => row.centroLabel,
    },
    {
      key: "descripcion", header: "Descripción",
      render: (row) => row.descripcion || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: "isActive", header: "Estado", className: "w-28",
      render: (row) => <CatalogStatusBadge isActive={row.isActive} />,
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
    { key: "nombre",      label: "Nombre",              canHide: false },
    { key: "tipoLabel",   label: "Tipo" },
    { key: "centroLabel", label: "Centro de atención" },
    { key: "descripcion", label: "Descripción" },
    { key: "isActive",    label: "Estado" },
    { key: "actions",     label: "Acciones",            canHide: false },
  ];

  const tableOptions: TableOptionItem[] = [
    { id: "refresh", label: "Actualizar", icon: RotateCcw, isLoading: isFetching,
      disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); } },
  ];

  const filterSections = [
    {
      id: "status", label: "Estado",
      options: [
        { id: STATUS_FILTER.ACTIVE, label: "Activos", selected: statusFilter === STATUS_FILTER.ACTIVE,
          onSelect: () => { setStatusFilter(STATUS_FILTER.ACTIVE); setPage(1); } },
        { id: STATUS_FILTER.INACTIVE, label: "Inactivos", selected: statusFilter === STATUS_FILTER.INACTIVE,
          onSelect: () => { setStatusFilter(STATUS_FILTER.INACTIVE); setPage(1); } },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Almacenes"
      description="Catálogo de almacenes por tipo y centro de atención."
      icon={<Warehouse className="size-12" />}
    >
      <TableHeaderBar
        search={<TableSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar almacén" />}
        actions={
          <>
            <TableFilterMenu sections={filterSections} appliedCount={appliedFiltersCount} onClear={handleClearFilters} />
            <TableColumnVisibility columns={visibilityOptions} visibility={columnVisibility} onVisibilityChange={setColumnVisibility} />
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction permission="almacen:almacenes:create" label="Nuevo almacén"
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
        errorTitle="No se pudo cargar almacenes"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0}
        onRetry={() => { void refetch(); }}
        onClearFilters={handleClearFilters}
        pagination={{ page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); } }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin almacenes"
        emptyDescription="Registra los almacenes de insumos de la clínica."
      />

      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setEditingItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingItem ? "Editar almacén" : "Nuevo almacén"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={f("nombre")} placeholder="Nombre del almacén" />
            </div>
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <select value={form.tipo} onChange={f("tipo")} className="w-full border rounded-md px-3 py-2 text-sm">
                {Object.entries(ALMACEN_TIPO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Centro de atención *</Label>
              <select value={form.idCentroAtencion} onChange={f("idCentroAtencion")} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">— Selecciona —</option>
                {centrosData?.items.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Descripción</Label>
              <Textarea value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Opcional" rows={2} />
            </div>
          </div>
          {editingItem && (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label className="cursor-pointer">Estado</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{form.isActive ? "Activo" : "Inactivo"}</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => { void handleSave(); }}
              disabled={createAlmacen.isPending || updateAlmacen.isPending || !form.nombre.trim() || !form.idCentroAtencion}>
              {(createAlmacen.isPending || updateAlmacen.isPending) ? "Guardando..." : editingItem ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(v) => { setDeleteOpen(v); if (!v) setItemToDelete(null); }}
        title="Eliminar almacén"
        description={`Se eliminará "${itemToDelete?.nombre}".`}
        onConfirm={() => { void handleDelete(); }}
        confirmDisabled={deleteAlmacen.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default AlmacenesPage;
