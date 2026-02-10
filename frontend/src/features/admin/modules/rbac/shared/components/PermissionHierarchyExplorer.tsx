import { useState, type ComponentProps, type ReactNode } from "react";
import { FolderTree, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  buildPermissionHierarchy,
  formatPermissionSegment,
  type PermissionHierarchyActionNode,
  type PermissionHierarchyEntry,
} from "@features/admin/modules/rbac/shared/utils/permission-hierarchy";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

interface PermissionHierarchyExplorerProps<T> {
  title: string;
  description?: string;
  entries: PermissionHierarchyEntry<T>[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingRows?: number;
  className?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  actionVariant?: ButtonVariant;
  actionDisplay?: "button" | "icon";
  isActionPending?: boolean;
  isActionDisabled?: (item: PermissionHierarchyActionNode<T>) => boolean;
  actionAriaLabel?: (item: PermissionHierarchyActionNode<T>) => string;
  onAction?: (item: PermissionHierarchyActionNode<T>) => void;
  renderMeta?: (item: PermissionHierarchyActionNode<T>) => ReactNode;
  renderAction?: (item: PermissionHierarchyActionNode<T>) => ReactNode;
}

export function PermissionHierarchyExplorer<T>({
  title,
  description,
  entries,
  searchPlaceholder = "Buscar permiso por codigo o descripcion",
  emptyMessage = "No hay permisos disponibles para mostrar.",
  isLoading = false,
  loadingRows = 5,
  className,
  actionLabel = "Agregar",
  actionIcon,
  actionVariant = "outline",
  actionDisplay = "button",
  isActionPending = false,
  isActionDisabled,
  actionAriaLabel,
  onAction,
  renderMeta,
  renderAction,
}: PermissionHierarchyExplorerProps<T>) {
  const [search, setSearch] = useState("");

  const normalizedTerm = search.trim().toLowerCase();
  const filteredEntries = normalizedTerm
    ? entries.filter((entry) => {
        const searchableValue =
          `${entry.code} ${entry.description}`.toLowerCase();
        return searchableValue.includes(normalizedTerm);
      })
    : entries;

  const hierarchy = buildPermissionHierarchy(filteredEntries);
  const defaultOpenGroups = hierarchy.map((group) => group.key);

  const renderDefaultAction = (item: PermissionHierarchyActionNode<T>) => {
    if (!onAction) return null;

    const disabled = isActionPending || Boolean(isActionDisabled?.(item));
    const label = actionAriaLabel?.(item) || `${actionLabel} ${item.code}`;

    if (actionDisplay === "icon") {
      return (
        <Button
          type="button"
          size="icon-sm"
          variant={actionVariant}
          onClick={() => onAction(item)}
          disabled={disabled}
          aria-label={label}
        >
          {actionIcon}
        </Button>
      );
    }

    return (
      <Button
        type="button"
        size="sm"
        variant={actionVariant}
        onClick={() => onAction(item)}
        disabled={disabled}
        aria-label={label}
      >
        {actionIcon}
        {actionLabel}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-line-struct bg-paper p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-txt-body">{title}</p>
          {description ? (
            <p className="text-xs text-txt-muted">{description}</p>
          ) : null}
        </div>
        <Badge variant="outline">{filteredEntries.length}</Badge>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-txt-muted" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      <ScrollArea className="mt-4 h-[360px] rounded-xl border border-line-struct/60 bg-subtle/30">
        <div className="p-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: loadingRows }).map((_, index) => (
                <Skeleton
                  key={`permission-hierarchy-loading-${index}`}
                  className="h-18 rounded-xl"
                />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-struct/60 px-4 py-8 text-center text-sm text-txt-muted">
              {emptyMessage}
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={defaultOpenGroups}
              className="space-y-3"
            >
              {hierarchy.map((groupNode) => (
                <AccordionItem
                  key={groupNode.key}
                  value={groupNode.key}
                  className="rounded-xl border border-line-struct/60 bg-paper px-4"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex flex-wrap items-center gap-2 text-left">
                      <FolderTree className="size-4 text-txt-muted" />
                      <span className="text-sm font-semibold text-txt-body">
                        {formatPermissionSegment(groupNode.group)}
                      </span>
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[11px]"
                      >
                        {groupNode.totalCount}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-4">
                    {groupNode.modules.map((moduleNode) => (
                      <div
                        key={moduleNode.key}
                        className="rounded-xl border border-line-struct/60 bg-subtle/40 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
                            Modulo: {formatPermissionSegment(moduleNode.module)}
                          </p>
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[11px]"
                          >
                            {moduleNode.totalCount}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-3">
                          {moduleNode.submodules.map((submoduleNode) => (
                            <div
                              key={submoduleNode.key}
                              className="rounded-lg border border-line-struct/50 bg-paper px-3 py-3"
                            >
                              <p className="text-[11px] font-semibold tracking-wide text-txt-muted uppercase">
                                Submodulo:{" "}
                                {formatPermissionSegment(
                                  submoduleNode.submodule,
                                )}
                              </p>
                              <div className="mt-2 space-y-2">
                                {submoduleNode.actions.map((actionNode) => (
                                  <div
                                    key={actionNode.id}
                                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line-struct/40 bg-subtle/20 px-3 py-2"
                                  >
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <p className="text-[11px] font-semibold tracking-wide text-txt-muted uppercase">
                                        Accion:{" "}
                                        {formatPermissionSegment(
                                          actionNode.path.action,
                                        )}
                                      </p>
                                      <p className="truncate text-sm font-medium text-txt-body">
                                        {actionNode.code}
                                      </p>
                                      <p className="text-xs text-txt-muted">
                                        {actionNode.description}
                                      </p>
                                      {renderMeta
                                        ? renderMeta(actionNode)
                                        : null}
                                    </div>
                                    {renderAction
                                      ? renderAction(actionNode)
                                      : renderDefaultAction(actionNode)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
