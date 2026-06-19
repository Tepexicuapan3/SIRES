import { useState } from "react";
import { toast } from "sonner";
import { Truck, Plus, RotateCcw, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
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
import { Textarea } from "@shared/ui/textarea";
import type { CatProveedor } from "@api/types";
import { useProveedoresList } from "../queries/useCatalogosQueries";
import { useCreateProveedor, useUpdateProveedor, useDeleteProveedor } from "../mutations/useCatalogosMutations";
import { getCatalogErrorMessage } from "../utils/catalogos.feedback";

const STATUS_FILTER = { ALL: "all", ACTIVE: "active", INACTIVE: "inactive" } as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function ProveedoresPage() {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER.ALL);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    nombre: true, contacto: true, telefono: true, correo: true, rfc: true, isActive: true, actions: true,
  });
  const [createOpen, setCreateOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatProveedor | null>(null);
  const [editingItem, setEditingItem]   = useState<CatProveedor | null>(null);
  const [form, setForm] = useState({
    nombre: "", contacto: "", telefono: "", correo: "", direccion: "", rfc: "", isActive: true,
  });

  const debouncedSearch  = useDebounce(search, 400);
  const createProveedor  = useCreateProveedor();
  const updateProveedor  = useUpdateProveedor();
  const deleteProveedor  = useDeleteProveedor();

  const { data, isLoading, isFetching, error, refetch } = useProveedoresList({
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
    setForm({ nombre: "", contacto: "", telefono: "", correo: "", direccion: "", rfc: "", isActive: true });
    setCreateOpen(true);
  };

  const handleOpenEdit = (item: CatProveedor) => {
    setEditingItem(item);
    setForm({
      nombre: item.nombre, contacto: item.contacto ?? "", telefono: item.telefono ?? "",
      correo: item.correo ?? "", direccion: item.direccion ?? "", rfc: item.rfc ?? "",
      isActive: item.isActive,
    });
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    const payload = {
      nombre: form.nombre.trim(), contacto: form.contacto || undefined,
      telefono: form.telefono || undefined, correo: form.correo || undefined,
      direccion: form.direccion || undefined, rfc: form.rfc || undefined,
    };
    try {
      if (editingItem) {
        await updateProveedor.mutateAsync({ id: editingItem.id, data: { ...payload, isActive: form.isActive } });
        toast.success("Proveedor actualizado");
      } else {
        await createProveedor.mutateAsync(payload);
        toast.success("Proveedor creado");
      }
      setForm({ nombre: "", contacto: "", telefono: "", correo: "", direccion: "", rfc: "", isActive: true });
      setCreateOpen(false); setEditingItem(null);
    } catch (err) {
      toast.error(editingItem ? "Error al actualizar" : "Error al crear", { description: getCatalogErrorMessage(err, "Verifica los datos") });
    }
  };

  const handleToggleStatus = async (item: CatProveedor) => {
    try {
      await updateProveedor.mutateAsync({ id: item.id, data: { isActive: !item.isActive } });
      toast.success(item.isActive ? "Proveedor desactivado" : "Proveedor activado");
    } catch (err) {
      toast.error("No se pudo actualizar el estado", { description: getCatalogErrorMessage(err, "Intenta nuevamente") });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteProveedor.mutateAsync(itemToDelete.id);
      toast.success("Proveedor eliminado");
      setDeleteOpen(false); setItemToDelete(null);
    } catch (err) {
      toast.error("No se pudo eliminar", { description: getCatalogErrorMessage(err, "Error al eliminar") });
    }
  };

  const handleClearFilters = () => { setSearch(""); setStatusFilter(STATUS_FILTER.ALL); setPage(1); };

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(Boolean).length;
  const isStatusPending     = updateProveedor.isPending;

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const allColumns: DataTableColumn<CatProveedor>[] = [
    {
      key: "nombre", header: "Nombre",
      render: (row) => <span className="font-medium">{row.nombre}</span>,
    },
    {
      key: "contacto", header: "Contacto",
      render: (row) => row.contacto || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: "telefono", header: "Teléfono", className: "w-32",
      render: (row) => row.telefono || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: "correo", header: "Correo",
      render: (row) => row.correo || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: "rfc", header: "RFC", className: "w-32",
      render: (row) => row.rfc
        ? <span className="font-mono text-xs">{row.rfc}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
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
    { key: "nombre",    label: "Nombre",    canHide: false },
    { key: "contacto",  label: "Contacto" },
    { key: "telefono",  label: "Teléfono" },
    { key: "correo",    label: "Correo" },
    { key: "rfc",       label: "RFC" },
    { key: "isActive",  label: "Estado" },
    { key: "actions",   label: "Acciones",  canHide: false },
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
      title="Proveedores"
      description="Catálogo de proveedores de insumos médicos."
      icon={<Truck className="size-12" />}
    >
      <TableHeaderBar
        search={<TableSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar proveedor" />}
        actions={
          <>
            <TableFilterMenu sections={filterSections} appliedCount={appliedFiltersCount} onClear={handleClearFilters} />
            <TableColumnVisibility columns={visibilityOptions} visibility={columnVisibility} onVisibilityChange={setColumnVisibility} />
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction permission="almacen:proveedores:create" label="Nuevo proveedor"
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
        errorTitle="No se pudo cargar proveedores"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0}
        onRetry={() => { void refetch(); }}
        onClearFilters={handleClearFilters}
        pagination={{ page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); } }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin proveedores"
        emptyDescription="Registra los proveedores de insumos."
      />

      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setEditingItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingItem ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={f("nombre")} placeholder="Nombre del proveedor" />
            </div>
            <div className="space-y-1">
              <Label>Contacto</Label>
              <Input value={form.contacto} onChange={f("contacto")} placeholder="Nombre del contacto" />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={f("telefono")} type="tel" placeholder="Ej: 55 1234 5678" />
            </div>
            <div className="space-y-1">
              <Label>Correo</Label>
              <Input value={form.correo} onChange={f("correo")} type="email" placeholder="correo@proveedor.com" />
            </div>
            <div className="space-y-1">
              <Label>RFC</Label>
              <Input value={form.rfc} onChange={(e) => setForm((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))}
                placeholder="RFC123456789" maxLength={15} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Dirección</Label>
              <Textarea value={form.direccion} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, direccion: e.target.value }))} placeholder="Calle, número, colonia, ciudad..." rows={2} />
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
              disabled={createProveedor.isPending || updateProveedor.isPending || !form.nombre.trim()}>
              {(createProveedor.isPending || updateProveedor.isPending) ? "Guardando..." : editingItem ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(v) => { setDeleteOpen(v); if (!v) setItemToDelete(null); }}
        title="Eliminar proveedor"
        description={`Se eliminará "${itemToDelete?.nombre}".`}
        onConfirm={() => { void handleDelete(); }}
        confirmDisabled={deleteProveedor.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default ProveedoresPage;
