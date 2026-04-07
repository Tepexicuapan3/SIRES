import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FolderTree,
  KeyRound,
  Layers,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { TruncatedTooltip } from "@shared/ui/truncated-tooltip";
import { cn } from "@shared/utils/styling/cn";
import type { Permission } from "@api/types";
import { usePermissionsCatalog } from "@/domains/auth-access/hooks/rbac/permissions/usePermissionsCatalog";
import { PermissionSearchField } from "@/domains/auth-access/components/admin/rbac/shared/PermissionSearchField";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

const PERMISSION_TREE_ROW_TYPE = {
  GROUP: "group",
  MODULE: "module",
  SUBMODULE: "submodule",
  ACTION: "action",
} as const;

type PermissionTreeRowType =
  (typeof PERMISSION_TREE_ROW_TYPE)[keyof typeof PERMISSION_TREE_ROW_TYPE];

const PERMISSION_ROW_HEIGHT: Record<PermissionTreeRowType, number> = {
  [PERMISSION_TREE_ROW_TYPE.GROUP]: 52,
  [PERMISSION_TREE_ROW_TYPE.MODULE]: 48,
  [PERMISSION_TREE_ROW_TYPE.SUBMODULE]: 46,
  [PERMISSION_TREE_ROW_TYPE.ACTION]: 68,
};

const VIRTUALIZATION_THRESHOLD = 100;
const VIRTUALIZATION_OVERSCAN_PX = 320;
const DEFAULT_SUBMODULE_KEY = "general";

export interface PermissionExplorerItem {
  id: number;
  code: string;
  description: string;
  isSystem?: boolean;
}

interface PermissionHierarchyExplorerProps<
  TPermission extends PermissionExplorerItem = Permission,
> {
  permissions: TPermission[];
  isLoading?: boolean;
  className?: string;
  selectedPermissionCode?: string | null;
  onSelectPermission?: (permission: TPermission) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
  viewportHeightClassName?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  actionVariant?: ButtonVariant;
  actionDisplay?: "button" | "icon";
  isActionPending?: boolean;
  isActionDisabled?: (permission: TPermission) => boolean;
  actionAriaLabel?: (permission: TPermission) => string;
  actionClassName?: string;
  onAction?: (permission: TPermission) => void;
  renderMeta?: (permission: TPermission) => ReactNode;
  metaDisplay?: "inline" | "footer";
  showCodeBadge?: boolean;
}

interface PermissionsCatalogExplorerProps extends Omit<
  PermissionHierarchyExplorerProps<Permission>,
  "permissions" | "isLoading"
> {
  enabled?: boolean;
}

interface PermissionCodeSegments {
  groupKey: string;
  moduleKey: string;
  submoduleKey: string;
  actionKey: string;
}

interface PermissionActionNode<TPermission extends PermissionExplorerItem> {
  id: string;
  label: string;
  permission: TPermission;
}

interface PermissionSubmoduleNode<TPermission extends PermissionExplorerItem> {
  id: string;
  key: string;
  label: string;
  permissionsCount: number;
  actions: PermissionActionNode<TPermission>[];
}

interface PermissionModuleNode<TPermission extends PermissionExplorerItem> {
  id: string;
  key: string;
  label: string;
  permissionsCount: number;
  submodulesCount: number;
  submodules: PermissionSubmoduleNode<TPermission>[];
}

interface PermissionGroupNode<TPermission extends PermissionExplorerItem> {
  id: string;
  key: string;
  label: string;
  permissionsCount: number;
  modulesCount: number;
  modules: PermissionModuleNode<TPermission>[];
}

interface PermissionTreeBuildResult<
  TPermission extends PermissionExplorerItem,
> {
  groups: PermissionGroupNode<TPermission>[];
  expandableIds: string[];
}

interface PermissionTreeRowBase {
  id: string;
  depth: number;
}

interface PermissionTreeGroupRow<
  TPermission extends PermissionExplorerItem,
> extends PermissionTreeRowBase {
  type: typeof PERMISSION_TREE_ROW_TYPE.GROUP;
  node: PermissionGroupNode<TPermission>;
  isExpanded: boolean;
}

interface PermissionTreeModuleRow<
  TPermission extends PermissionExplorerItem,
> extends PermissionTreeRowBase {
  type: typeof PERMISSION_TREE_ROW_TYPE.MODULE;
  node: PermissionModuleNode<TPermission>;
  isExpanded: boolean;
}

interface PermissionTreeSubmoduleRow<
  TPermission extends PermissionExplorerItem,
> extends PermissionTreeRowBase {
  type: typeof PERMISSION_TREE_ROW_TYPE.SUBMODULE;
  node: PermissionSubmoduleNode<TPermission>;
  isExpanded: boolean;
}

interface PermissionTreeActionRow<
  TPermission extends PermissionExplorerItem,
> extends PermissionTreeRowBase {
  type: typeof PERMISSION_TREE_ROW_TYPE.ACTION;
  node: PermissionActionNode<TPermission>;
}

type PermissionTreeRow<TPermission extends PermissionExplorerItem> =
  | PermissionTreeGroupRow<TPermission>
  | PermissionTreeModuleRow<TPermission>
  | PermissionTreeSubmoduleRow<TPermission>
  | PermissionTreeActionRow<TPermission>;

interface PermissionTreeRowsResult<TPermission extends PermissionExplorerItem> {
  rows: PermissionTreeRow<TPermission>[];
  actionsCount: number;
}

interface DraftSubmoduleNode<TPermission extends PermissionExplorerItem> {
  id: string;
  key: string;
  label: string;
  actions: PermissionActionNode<TPermission>[];
}

interface DraftModuleNode<TPermission extends PermissionExplorerItem> {
  id: string;
  key: string;
  label: string;
  submodules: Map<string, DraftSubmoduleNode<TPermission>>;
}

interface DraftGroupNode<TPermission extends PermissionExplorerItem> {
  id: string;
  key: string;
  label: string;
  modules: Map<string, DraftModuleNode<TPermission>>;
}

const compareByLabel = <T extends { label: string }>(a: T, b: T) =>
  a.label.localeCompare(b.label, "es");

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const parsePermissionCode = (code: string): PermissionCodeSegments => {
  const segments = code
    .split(":")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length >= 4) {
    return {
      groupKey: segments[0],
      moduleKey: segments[1],
      submoduleKey: segments[2],
      actionKey: segments.slice(3).join(":"),
    };
  }

  if (segments.length === 3) {
    return {
      groupKey: segments[0],
      moduleKey: segments[1],
      submoduleKey: DEFAULT_SUBMODULE_KEY,
      actionKey: segments[2],
    };
  }

  if (segments.length === 2) {
    return {
      groupKey: segments[0],
      moduleKey: segments[1],
      submoduleKey: DEFAULT_SUBMODULE_KEY,
      actionKey: "read",
    };
  }

  return {
    groupKey: segments[0] ?? "sin-grupo",
    moduleKey: segments[1] ?? "general",
    submoduleKey: DEFAULT_SUBMODULE_KEY,
    actionKey: segments[2] ?? "read",
  };
};

const formatHierarchyLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const renderHighlightedText = (text: string, query: string): ReactNode => {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return text;
  }

  const matcher = new RegExp(`(${escapeRegExp(cleanQuery)})`, "ig");
  const segments = text.split(matcher);

  if (segments.length === 1) {
    return text;
  }

  return segments.map((segment, index) => {
    const isMatch = segment.toLowerCase() === cleanQuery.toLowerCase();

    return isMatch ? (
      <mark
        key={`${segment}-${index}`}
        className="rounded bg-brand/15 px-0.5 text-txt-body"
      >
        {segment}
      </mark>
    ) : (
      <span key={`${segment}-${index}`}>{segment}</span>
    );
  });
};

const permissionMatchesSearch = (
  permission: PermissionExplorerItem,
  query: string,
) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const hierarchy = parsePermissionCode(permission.code);

  const searchableFields = [
    permission.code,
    permission.description,
    hierarchy.groupKey,
    hierarchy.moduleKey,
    hierarchy.submoduleKey,
    hierarchy.actionKey,
    formatHierarchyLabel(hierarchy.groupKey),
    formatHierarchyLabel(hierarchy.moduleKey),
    formatHierarchyLabel(hierarchy.submoduleKey),
    formatHierarchyLabel(hierarchy.actionKey),
  ].map(normalizeSearchText);

  return queryTokens.every((token) =>
    searchableFields.some((field) => field.includes(token)),
  );
};

const buildPermissionTree = <TPermission extends PermissionExplorerItem>(
  permissions: TPermission[],
): PermissionTreeBuildResult<TPermission> => {
  const groups = new Map<string, DraftGroupNode<TPermission>>();

  permissions.forEach((permission) => {
    const hierarchy = parsePermissionCode(permission.code);
    const groupId = `group:${hierarchy.groupKey}`;
    const moduleId = `${groupId}/module:${hierarchy.moduleKey}`;
    const submoduleId = `${moduleId}/submodule:${hierarchy.submoduleKey}`;

    let groupNode = groups.get(hierarchy.groupKey);
    if (!groupNode) {
      groupNode = {
        id: groupId,
        key: hierarchy.groupKey,
        label: formatHierarchyLabel(hierarchy.groupKey),
        modules: new Map<string, DraftModuleNode<TPermission>>(),
      };
      groups.set(hierarchy.groupKey, groupNode);
    }

    let moduleNode = groupNode.modules.get(hierarchy.moduleKey);
    if (!moduleNode) {
      moduleNode = {
        id: moduleId,
        key: hierarchy.moduleKey,
        label: formatHierarchyLabel(hierarchy.moduleKey),
        submodules: new Map<string, DraftSubmoduleNode<TPermission>>(),
      };
      groupNode.modules.set(hierarchy.moduleKey, moduleNode);
    }

    let submoduleNode = moduleNode.submodules.get(hierarchy.submoduleKey);
    if (!submoduleNode) {
      submoduleNode = {
        id: submoduleId,
        key: hierarchy.submoduleKey,
        label: formatHierarchyLabel(hierarchy.submoduleKey),
        actions: [],
      };
      moduleNode.submodules.set(hierarchy.submoduleKey, submoduleNode);
    }

    submoduleNode.actions.push({
      id: `action:${permission.code}`,
      label: formatHierarchyLabel(hierarchy.actionKey),
      permission,
    });
  });

  const expandableIds: string[] = [];
  const normalizedGroups = Array.from(groups.values())
    .sort(compareByLabel)
    .map<PermissionGroupNode<TPermission>>((groupNode) => {
      const normalizedModules = Array.from(groupNode.modules.values())
        .sort(compareByLabel)
        .map<PermissionModuleNode<TPermission>>((moduleNode) => {
          const normalizedSubmodules = Array.from(
            moduleNode.submodules.values(),
          )
            .sort(compareByLabel)
            .map<PermissionSubmoduleNode<TPermission>>((submoduleNode) => {
              const sortedActions = [...submoduleNode.actions].sort((a, b) =>
                a.label.localeCompare(b.label, "es"),
              );

              if (sortedActions.length > 0) {
                expandableIds.push(submoduleNode.id);
              }

              return {
                id: submoduleNode.id,
                key: submoduleNode.key,
                label: submoduleNode.label,
                permissionsCount: sortedActions.length,
                actions: sortedActions,
              };
            });

          const permissionsCount = normalizedSubmodules.reduce(
            (total, submodule) => total + submodule.permissionsCount,
            0,
          );

          if (normalizedSubmodules.length > 0) {
            expandableIds.push(moduleNode.id);
          }

          return {
            id: moduleNode.id,
            key: moduleNode.key,
            label: moduleNode.label,
            permissionsCount,
            submodulesCount: normalizedSubmodules.length,
            submodules: normalizedSubmodules,
          };
        });

      const permissionsCount = normalizedModules.reduce(
        (total, module) => total + module.permissionsCount,
        0,
      );

      if (normalizedModules.length > 0) {
        expandableIds.push(groupNode.id);
      }

      return {
        id: groupNode.id,
        key: groupNode.key,
        label: groupNode.label,
        permissionsCount,
        modulesCount: normalizedModules.length,
        modules: normalizedModules,
      };
    });

  return {
    groups: normalizedGroups,
    expandableIds,
  };
};

const buildTreeRows = <TPermission extends PermissionExplorerItem>(
  groups: PermissionGroupNode<TPermission>[],
  expandedIds: Set<string>,
): PermissionTreeRowsResult<TPermission> => {
  const rows: PermissionTreeRow<TPermission>[] = [];
  let actionsCount = 0;

  groups.forEach((groupNode) => {
    const groupExpanded = expandedIds.has(groupNode.id);

    rows.push({
      id: groupNode.id,
      depth: 0,
      type: PERMISSION_TREE_ROW_TYPE.GROUP,
      node: groupNode,
      isExpanded: groupExpanded,
    });

    if (!groupExpanded) {
      return;
    }

    groupNode.modules.forEach((moduleNode) => {
      const moduleExpanded = expandedIds.has(moduleNode.id);

      rows.push({
        id: moduleNode.id,
        depth: 1,
        type: PERMISSION_TREE_ROW_TYPE.MODULE,
        node: moduleNode,
        isExpanded: moduleExpanded,
      });

      if (!moduleExpanded) {
        return;
      }

      moduleNode.submodules.forEach((submoduleNode) => {
        const submoduleExpanded = expandedIds.has(submoduleNode.id);

        rows.push({
          id: submoduleNode.id,
          depth: 2,
          type: PERMISSION_TREE_ROW_TYPE.SUBMODULE,
          node: submoduleNode,
          isExpanded: submoduleExpanded,
        });

        if (!submoduleExpanded) {
          return;
        }

        submoduleNode.actions.forEach((actionNode) => {
          actionsCount += 1;
          rows.push({
            id: actionNode.id,
            depth: 3,
            type: PERMISSION_TREE_ROW_TYPE.ACTION,
            node: actionNode,
          });
        });
      });
    });
  });

  return {
    rows,
    actionsCount,
  };
};

const findStartIndex = (offsets: number[], value: number) => {
  let low = 0;
  let high = offsets.length - 1;
  let result = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (offsets[middle] <= value) {
      result = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return result;
};

const rowPaddingLeft = (depth: number) => `${depth * 20 + 8}px`;

export function PermissionsHierarchyExplorer<
  TPermission extends PermissionExplorerItem = Permission,
>({
  permissions,
  isLoading = false,
  className,
  selectedPermissionCode,
  onSelectPermission,
  title,
  description,
  searchPlaceholder = "Buscar por codigo, descripcion o jerarquia",
  emptyMessage = "Sin permisos disponibles",
  noResultsMessage = "No se encontraron permisos",
  viewportHeightClassName = "h-[560px]",
  actionLabel = "Agregar",
  actionIcon,
  actionVariant = "outline",
  actionDisplay = "button",
  isActionPending = false,
  isActionDisabled,
  actionAriaLabel,
  actionClassName,
  onAction,
  renderMeta,
  metaDisplay = "inline",
  showCodeBadge = true,
}: PermissionHierarchyExplorerProps<TPermission>) {
  const [searchValue, setSearchValue] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [hasExpansionOverride, setHasExpansionOverride] = useState(false);
  const [internalSelectedCode, setInternalSelectedCode] = useState<
    string | null
  >(null);
  const [viewportHeight, setViewportHeight] = useState(560);
  const [scrollTop, setScrollTop] = useState(0);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const normalizedSearchValue = searchValue.trim();
  const isSearching = normalizedSearchValue.length > 0;

  const fullTree = buildPermissionTree(permissions);
  const filteredPermissions = isSearching
    ? permissions.filter((permission) =>
        permissionMatchesSearch(permission, normalizedSearchValue),
      )
    : permissions;
  const visibleTree = isSearching
    ? buildPermissionTree(filteredPermissions)
    : fullTree;

  const effectiveExpandedIds = isSearching
    ? new Set<string>(visibleTree.expandableIds)
    : hasExpansionOverride
      ? expandedNodeIds
      : new Set<string>(fullTree.expandableIds);

  const rowsData = buildTreeRows(visibleTree.groups, effectiveExpandedIds);
  const shouldVirtualize = rowsData.actionsCount > VIRTUALIZATION_THRESHOLD;
  const actionRowHeight =
    renderMeta && metaDisplay === "footer" ? 92 : PERMISSION_ROW_HEIGHT.ACTION;

  const getRowHeight = (row: PermissionTreeRow<TPermission>) =>
    row.type === PERMISSION_TREE_ROW_TYPE.ACTION
      ? actionRowHeight
      : PERMISSION_ROW_HEIGHT[row.type];

  const rowOffsets: number[] = [];
  let totalHeight = 0;
  rowsData.rows.forEach((row) => {
    rowOffsets.push(totalHeight);
    totalHeight += getRowHeight(row);
  });

  let startIndex = 0;
  let endIndex = rowsData.rows.length;

  if (shouldVirtualize && rowsData.rows.length > 0) {
    const startOffset = Math.max(scrollTop - VIRTUALIZATION_OVERSCAN_PX, 0);
    const endOffset = scrollTop + viewportHeight + VIRTUALIZATION_OVERSCAN_PX;

    startIndex = findStartIndex(rowOffsets, startOffset);
    endIndex = startIndex;

    while (
      endIndex < rowsData.rows.length &&
      rowOffsets[endIndex] < endOffset
    ) {
      endIndex += 1;
    }
  }

  const visibleRows = shouldVirtualize
    ? rowsData.rows.slice(startIndex, endIndex)
    : rowsData.rows;

  const selectedCode = selectedPermissionCode ?? internalSelectedCode;
  const canSelectPermission = Boolean(onSelectPermission);

  useEffect(() => {
    if (!shouldVirtualize) {
      return;
    }

    const viewportElement = viewportRef.current;
    if (!viewportElement) {
      return;
    }

    const syncViewportHeight = () => {
      setViewportHeight(viewportElement.clientHeight);
    };

    syncViewportHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(syncViewportHeight);
    observer.observe(viewportElement);

    return () => {
      observer.disconnect();
    };
  }, [shouldVirtualize, rowsData.rows.length]);

  const handleToggleNode = (nodeId: string) => {
    if (isSearching) {
      return;
    }

    setHasExpansionOverride(true);
    setExpandedNodeIds((previous) => {
      const next = new Set(previous);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setHasExpansionOverride(true);
    setExpandedNodeIds(new Set<string>(fullTree.expandableIds));
  };

  const handleCollapseAll = () => {
    setHasExpansionOverride(true);
    setExpandedNodeIds(new Set<string>());
  };

  const handleSelectPermission = (permission: TPermission) => {
    setInternalSelectedCode(permission.code);
    onSelectPermission?.(permission);
  };

  const resetViewportScroll = () => {
    const viewportElement = viewportRef.current;
    if (viewportElement) {
      viewportElement.scrollTop = 0;
    }
    setScrollTop(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    resetViewportScroll();
  };

  const renderChevron = (isExpanded: boolean) =>
    isExpanded ? (
      <ChevronDown className="size-4 text-txt-muted" />
    ) : (
      <ChevronRight className="size-4 text-txt-muted" />
    );

  const renderActionControl = (permission: TPermission) => {
    if (!onAction) {
      return null;
    }

    const isDisabled =
      isActionPending || Boolean(isActionDisabled?.(permission));
    const label =
      actionAriaLabel?.(permission) ?? `${actionLabel} ${permission.code}`;

    if (actionDisplay === "icon") {
      return (
        <Button
          type="button"
          size="icon-sm"
          variant={actionVariant}
          onClick={() => onAction(permission)}
          disabled={isDisabled}
          aria-label={label}
          className={cn(actionClassName)}
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
        onClick={() => onAction(permission)}
        disabled={isDisabled}
        aria-label={label}
        className={cn(actionClassName)}
      >
        {actionIcon}
        {actionLabel}
      </Button>
    );
  };

  const renderRow = (row: PermissionTreeRow<TPermission>) => {
    if (row.type === PERMISSION_TREE_ROW_TYPE.GROUP) {
      return (
        <button
          type="button"
          onClick={() => handleToggleNode(row.id)}
          className="flex h-full w-full items-center justify-between gap-3 rounded-xl border border-line-struct/60 bg-paper/70 px-3 text-left transition-colors hover:bg-subtle/40"
          style={{ paddingLeft: rowPaddingLeft(row.depth) }}
        >
          <span className="inline-flex min-w-0 items-center gap-2.5">
            {renderChevron(row.isExpanded)}
            <FolderTree className="size-4 shrink-0 text-brand" />
            <span className="truncate text-sm font-semibold text-txt-body">
              {renderHighlightedText(row.node.label, normalizedSearchValue)}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              {pluralize(row.node.modulesCount, "modulo", "modulos")}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {pluralize(row.node.permissionsCount, "permiso", "permisos")}
            </Badge>
          </span>
        </button>
      );
    }

    if (row.type === PERMISSION_TREE_ROW_TYPE.MODULE) {
      return (
        <button
          type="button"
          onClick={() => handleToggleNode(row.id)}
          className="flex h-full w-full items-center justify-between gap-3 rounded-xl border border-line-struct/50 bg-paper/60 px-3 text-left transition-colors hover:bg-subtle/35"
          style={{ paddingLeft: rowPaddingLeft(row.depth) }}
        >
          <span className="inline-flex min-w-0 items-center gap-2.5">
            {renderChevron(row.isExpanded)}
            <Boxes className="size-4 shrink-0 text-status-info" />
            <span className="truncate text-sm font-medium text-txt-body">
              {renderHighlightedText(row.node.label, normalizedSearchValue)}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              {pluralize(row.node.submodulesCount, "submodulo", "submodulos")}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {pluralize(row.node.permissionsCount, "permiso", "permisos")}
            </Badge>
          </span>
        </button>
      );
    }

    if (row.type === PERMISSION_TREE_ROW_TYPE.SUBMODULE) {
      return (
        <button
          type="button"
          onClick={() => handleToggleNode(row.id)}
          className="flex h-full w-full items-center justify-between gap-3 rounded-lg border border-line-struct/45 bg-paper/50 px-3 text-left transition-colors hover:bg-subtle/30"
          style={{ paddingLeft: rowPaddingLeft(row.depth) }}
        >
          <span className="inline-flex min-w-0 items-center gap-2.5">
            {renderChevron(row.isExpanded)}
            <Layers className="size-4 shrink-0 text-status-alert" />
            <span className="truncate text-sm font-medium text-txt-body">
              {renderHighlightedText(row.node.label, normalizedSearchValue)}
            </span>
          </span>
          <Badge variant="outline" className="text-[11px]">
            {pluralize(row.node.permissionsCount, "permiso", "permisos")}
          </Badge>
        </button>
      );
    }

    const permission = row.node.permission;
    const isSelected = selectedCode === permission.code;
    const isMetaFooter = Boolean(renderMeta && metaDisplay === "footer");
    const summaryTitle = permission.description?.trim() || row.node.label;

    const summaryContent = isMetaFooter ? (
      <div className="flex min-w-0 items-center gap-2">
        <KeyRound
          className={cn(
            "size-4 shrink-0",
            isSelected ? "text-brand" : "text-status-stable",
          )}
        />
        <p className="truncate text-sm font-medium text-txt-body">
          {renderHighlightedText(summaryTitle, normalizedSearchValue)}
        </p>
      </div>
    ) : (
      <div className="flex min-w-0 items-start gap-2">
        <KeyRound
          className={cn(
            "mt-0.5 size-4 shrink-0",
            isSelected ? "text-brand" : "text-status-stable",
          )}
        />

        <div className="min-w-0 space-y-0">
          <p className="truncate text-sm font-medium text-txt-body">
            {renderHighlightedText(row.node.label, normalizedSearchValue)}
          </p>

          <p className="truncate text-xs leading-snug text-txt-muted">
            {renderHighlightedText(
              permission.description,
              normalizedSearchValue,
            )}
          </p>

          {renderMeta && !isMetaFooter ? (
            <div className="text-[11px] leading-snug text-txt-muted">
              {renderMeta(permission)}
            </div>
          ) : null}
        </div>
      </div>
    );

    const actionSummary = canSelectPermission ? (
      <button
        type="button"
        onClick={() => handleSelectPermission(permission)}
        className="min-w-0 flex-1 text-left"
      >
        {summaryContent}
      </button>
    ) : (
      <div className="min-w-0 flex-1">{summaryContent}</div>
    );

    const actionControls = (
      <div className="flex shrink-0 items-center gap-2">
        {showCodeBadge ? (
          <Badge
            variant="outline"
            className="max-w-65 px-2 py-0.5 font-mono text-[11px]"
          >
            <TruncatedTooltip
              label={permission.code}
              className="block min-w-0 max-w-full truncate"
              align="end"
            >
              {renderHighlightedText(permission.code, normalizedSearchValue)}
            </TruncatedTooltip>
          </Badge>
        ) : null}

        {renderActionControl(permission)}
      </div>
    );

    if (isMetaFooter) {
      return (
        <div
          className={cn(
            "h-full w-full overflow-hidden rounded-xl border transition-colors",
            isSelected
              ? "border-brand/50 bg-brand/5"
              : "border-line-struct/60 bg-paper/80 hover:bg-subtle/25",
          )}
          style={{ paddingLeft: rowPaddingLeft(row.depth) }}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            {actionSummary}
            {actionControls}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-struct/50 px-3 py-2 text-xs text-txt-muted">
            {renderMeta(permission)}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5",
          isSelected
            ? "border-brand/50 bg-brand/5"
            : "border-line-struct/45 bg-paper/45 hover:bg-subtle/25",
        )}
        style={{ paddingLeft: rowPaddingLeft(row.depth) }}
      >
        {actionSummary}
        {actionControls}
      </div>
    );
  };

  return (
    <section
      className={cn(
        "flex min-h-0 w-full flex-col gap-3 rounded-2xl border border-line-struct bg-paper p-4",
        className,
      )}
    >
      {title || description ? (
        <div>
          {title ? (
            <p className="text-sm font-semibold text-txt-body">{title}</p>
          ) : null}
          {description ? (
            <p className="text-xs text-txt-muted">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <PermissionSearchField
          value={searchValue}
          onValueChange={handleSearchChange}
          placeholder={searchPlaceholder}
          ariaLabel="Buscar permisos"
          className="flex-1"
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
          >
            <ChevronsUpDown className="size-4" />
            Expandir todo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
          >
            <ChevronsDownUp className="size-4" />
            Colapsar todo
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-txt-muted">
        <Badge variant="outline">
          {pluralize(permissions.length, "permiso", "permisos")}
        </Badge>
        {isSearching ? (
          <Badge variant="info">
            {pluralize(filteredPermissions.length, "resultado", "resultados")}{" "}
            encontrados
          </Badge>
        ) : null}
        {shouldVirtualize ? (
          <Badge variant="secondary">Scroll virtual activo</Badge>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2 rounded-xl border border-line-struct/60 bg-subtle/20 p-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={`permission-tree-skeleton-${index}`}
              className={cn("h-10", index % 3 === 0 ? "w-full" : "w-[94%]")}
            />
          ))}
        </div>
      ) : permissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-struct/70 bg-subtle/20 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-txt-body">{emptyMessage}</p>
        </div>
      ) : filteredPermissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-struct/70 bg-subtle/20 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-txt-body">
            {noResultsMessage}
          </p>
          <p className="mt-1 text-xs text-txt-muted">
            Ajusta el texto o limpia la busqueda para ver todo el catalogo.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => handleSearchChange("")}
          >
            Limpiar busqueda
          </Button>
        </div>
      ) : (
        <div
          ref={viewportRef}
          className={cn(
            "overflow-y-auto rounded-xl border border-line-struct/60 bg-subtle/20 p-2",
            viewportHeightClassName,
          )}
          onScroll={
            shouldVirtualize
              ? (event) => {
                  setScrollTop(event.currentTarget.scrollTop);
                }
              : undefined
          }
        >
          {shouldVirtualize ? (
            <div style={{ height: `${totalHeight}px`, position: "relative" }}>
              {visibleRows.map((row, index) => {
                const rowIndex = startIndex + index;
                const rowOffsetTop = rowOffsets[rowIndex] ?? 0;

                return (
                  <div
                    key={row.id}
                    className="absolute inset-x-0 px-1"
                    style={{
                      top: `${rowOffsetTop}px`,
                      height: `${getRowHeight(row)}px`,
                    }}
                  >
                    {renderRow(row)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {visibleRows.map((row) => (
                <div
                  key={row.id}
                  className="px-1"
                  style={{ height: `${getRowHeight(row)}px` }}
                >
                  {renderRow(row)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function PermissionsCatalogExplorer({
  enabled = true,
  className,
  selectedPermissionCode,
  onSelectPermission,
  title,
  description,
  searchPlaceholder,
  emptyMessage,
  noResultsMessage,
  viewportHeightClassName,
  actionLabel,
  actionIcon,
  actionVariant,
  actionDisplay,
  isActionPending,
  isActionDisabled,
  actionAriaLabel,
  actionClassName,
  onAction,
  renderMeta,
  metaDisplay,
  showCodeBadge,
}: PermissionsCatalogExplorerProps) {
  const permissionsCatalog = usePermissionsCatalog(enabled);

  const items = permissionsCatalog.data?.items ?? [];
  const isLoading =
    permissionsCatalog.isLoading ||
    (permissionsCatalog.isFetching && items.length === 0);

  return (
    <PermissionsHierarchyExplorer
      permissions={items}
      isLoading={isLoading}
      className={className}
      selectedPermissionCode={selectedPermissionCode}
      onSelectPermission={onSelectPermission}
      title={title}
      description={description}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      noResultsMessage={noResultsMessage}
      viewportHeightClassName={viewportHeightClassName}
      actionLabel={actionLabel}
      actionIcon={actionIcon}
      actionVariant={actionVariant}
      actionDisplay={actionDisplay}
      isActionPending={isActionPending}
      isActionDisabled={isActionDisabled}
      actionAriaLabel={actionAriaLabel}
      actionClassName={actionClassName}
      onAction={onAction}
      renderMeta={renderMeta}
      metaDisplay={metaDisplay}
      showCodeBadge={showCodeBadge}
    />
  );
}
