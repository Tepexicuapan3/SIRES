import { useMemo, useState } from "react";
import { FolderTree, Link2, ListTree, Plus, RotateCcw } from "lucide-react";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { Skeleton } from "@shared/ui/skeleton";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { ModuleTreeEditor } from "@features/admin/modules/menus/components/ModuleTreeEditor";
import { ModuleCreateWizard } from "@features/admin/modules/menus/components/ModuleCreateWizard";
import { MoveToFolderDialog } from "@features/admin/modules/menus/components/MoveToFolderDialog";
import { HideModuleDialog } from "@features/admin/modules/menus/components/HideModuleDialog";
import { RolePreviewPanel } from "@features/admin/modules/menus/components/RolePreviewPanel";
import { useModuleCatalog } from "@features/navigation/queries/useModuleCatalog";
import { getModuleErrorMessage } from "@features/admin/modules/menus/utils/menus.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { ModuleCatalogNodeDTO } from "@api/types";

/** Filtra el arbol por titulo (case-insensitive), conservando un nodo si
 * EL MISMO o CUALQUIERA de sus descendientes matchea -- asi una carpeta
 * cuyo titulo no matchea pero contiene un hijo que si, sigue apareciendo
 * (con el resto de sus hijos podados). */
function filterTreeByTitle(
  nodes: ModuleCatalogNodeDTO[],
  normalizedQuery: string,
): ModuleCatalogNodeDTO[] {
  if (!normalizedQuery) return nodes;

  const result: ModuleCatalogNodeDTO[] = [];
  for (const node of nodes) {
    const selfMatches = node.title.toLowerCase().includes(normalizedQuery);
    if (selfMatches) {
      // Matchea el propio nodo: se conserva el subarbol COMPLETO sin
      // podar (un admin buscando "Catálogos" espera ver todos sus hijos,
      // no solo los que ademas matchean el texto).
      result.push(node);
      continue;
    }

    const filteredChildren = filterTreeByTitle(node.items, normalizedQuery);
    if (filteredChildren.length > 0) {
      result.push({ ...node, items: filteredChildren });
    }
  }
  return result;
}

export function MenusPage() {
  const { hasCapability } = usePermissionDependencies();
  const [search, setSearch] = useState("");

  const canReadMenus = hasCapability("admin.menus.read", {
    allOf: ["admin:gestion:modulos:read"],
  });
  const canCreateModule = hasCapability("admin.menus.create", {
    allOf: ["admin:gestion:modulos:create"],
  });
  const canUpdateModule = hasCapability("admin.menus.update", {
    allOf: ["admin:gestion:modulos:update"],
  });
  const canDeleteModule = hasCapability("admin.menus.delete", {
    allOf: ["admin:gestion:modulos:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useModuleCatalog(
    canReadMenus,
    true,
  );
  const allNodes = useMemo(() => data?.modules ?? [], [data]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleNodes = useMemo(
    () => filterTreeByTitle(allNodes, normalizedSearch),
    [allNodes, normalizedSearch],
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<ModuleCatalogNodeDTO | null>(null);
  const [movingNode, setMovingNode] = useState<ModuleCatalogNodeDTO | null>(null);
  const [hideTarget, setHideTarget] = useState<{
    node: ModuleCatalogNodeDTO;
    nextIsActive: boolean;
  } | null>(null);

  const wizardOpen = createOpen || editingNode !== null;

  const handleWizardOpenChange = (open: boolean) => {
    if (!open) {
      setCreateOpen(false);
      setEditingNode(null);
    }
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-menus",
      label: "Actualizar",
      icon: RotateCcw,
      isLoading: isFetching,
      disabled: isFetching,
      onSelect: () => {
        if (isFetching) return;
        void refetch();
      },
    },
  ];

  const errorDescription =
    canReadMenus && error
      ? getModuleErrorMessage(
          error,
          "No se pudo obtener el catálogo de módulos. Intenta nuevamente.",
        )
      : undefined;

  return (
    <CatalogModuleLayout
      title="Menús y submenús"
      description="Decide qué aparece en el menú lateral de la aplicación: agrega pantallas nuevas, ordénalas en carpetas y controla qué ve cada quién."
      icon={<ListTree className="size-12" />}
    >
      {!canReadMenus ? (
        <AdminReadOnlyNotice message="No tienes acceso para consultar la gestión de menús." />
      ) : null}

      {canReadMenus ? (
        <div className="grid gap-3 rounded-xl border border-line-struct/60 bg-subtle/20 p-4 text-sm sm:grid-cols-2">
          <div className="flex gap-3">
            <FolderTree className="size-5 shrink-0 text-txt-muted" />
            <p className="text-txt-muted">
              <span className="font-semibold text-txt-body">Carpeta</span> —
              un menú que agrupa varias pantallas adentro (aparece en el
              lateral como un botón que se despliega).
            </p>
          </div>
          <div className="flex gap-3">
            <Link2 className="size-5 shrink-0 text-txt-muted" />
            <p className="text-txt-muted">
              <span className="font-semibold text-txt-body">
                Acceso directo
              </span>{" "}
              — un submenú que lleva directo a una pantalla (elige a cuál
              carpeta pertenece al crearlo).
            </p>
          </div>
        </div>
      ) : null}

      {canReadMenus ? (
        <TableHeaderBar
          search={
            <TableSearch
              value={search}
              onChange={setSearch}
              placeholder="Buscar módulo por título"
            />
          }
          actions={
            <>
              <TableOptionsMenu options={tableOptions} />
              {canCreateModule ? (
                <TablePrimaryAction
                  permission="admin:gestion:modulos:create"
                  dependencyAware
                  label="Nuevo módulo"
                  icon={<Plus className="size-4" />}
                  onClick={() => setCreateOpen(true)}
                />
              ) : null}
            </>
          }
        />
      ) : null}

      {canReadMenus && error ? (
        <div className="rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-sm text-status-critical">
          {errorDescription}
        </div>
      ) : null}

      {canReadMenus && isLoading ? (
        <div className="space-y-2 rounded-xl border border-line-struct/60 bg-subtle/20 p-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton
              key={`menus-tree-skeleton-${index}`}
              className={index % 3 === 0 ? "h-9 w-full" : "h-9 w-[88%]"}
            />
          ))}
        </div>
      ) : null}

      {canReadMenus && !isLoading && !error ? (
        <ModuleTreeEditor
          nodes={visibleNodes}
          canUpdate={canUpdateModule}
          canDelete={canDeleteModule}
          onEditNode={setEditingNode}
          onMoveNode={setMovingNode}
          onHideNode={(node, nextIsActive) => setHideTarget({ node, nextIsActive })}
        />
      ) : null}

      {canReadMenus ? <RolePreviewPanel /> : null}

      <ModuleCreateWizard
        open={wizardOpen}
        onOpenChange={handleWizardOpenChange}
        allNodes={allNodes}
        editingNode={editingNode}
      />

      <MoveToFolderDialog
        node={movingNode}
        allNodes={allNodes}
        open={movingNode !== null}
        onOpenChange={(open) => {
          if (!open) setMovingNode(null);
        }}
      />

      <HideModuleDialog
        node={hideTarget?.node ?? null}
        nextIsActive={hideTarget?.nextIsActive ?? false}
        open={hideTarget !== null}
        onOpenChange={(open) => {
          if (!open) setHideTarget(null);
        }}
      />
    </CatalogModuleLayout>
  );
}

export default MenusPage;
