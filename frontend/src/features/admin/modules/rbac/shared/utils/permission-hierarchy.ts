const DEFAULT_SUBMODULE = "general";

const ACTION_PRIORITY: Record<string, number> = {
  read: 0,
  create: 1,
  update: 2,
  delete: 3,
  manage: 4,
  assign: 5,
  revoke: 6,
};

const normalizeSegment = (value: string) => value.trim().toLowerCase();

const normalizeLabel = (value: string) =>
  value.trim().replace(/_/g, " ").replace(/\s+/g, " ");

const compareLabels = (first: string, second: string) =>
  normalizeLabel(first).localeCompare(normalizeLabel(second), "es", {
    sensitivity: "base",
  });

const getActionPriority = (action: string) =>
  ACTION_PRIORITY[normalizeSegment(action)] ?? 99;

export interface PermissionHierarchyPath {
  group: string;
  module: string;
  submodule: string;
  action: string;
}

export interface PermissionHierarchyEntry<T> {
  id: string;
  code: string;
  description: string;
  payload: T;
}

export interface PermissionHierarchyActionNode<
  T,
> extends PermissionHierarchyEntry<T> {
  path: PermissionHierarchyPath;
}

export interface PermissionHierarchySubmoduleNode<T> {
  key: string;
  submodule: string;
  actions: PermissionHierarchyActionNode<T>[];
  totalCount: number;
}

export interface PermissionHierarchyModuleNode<T> {
  key: string;
  module: string;
  submodules: PermissionHierarchySubmoduleNode<T>[];
  totalCount: number;
}

export interface PermissionHierarchyGroupNode<T> {
  key: string;
  group: string;
  modules: PermissionHierarchyModuleNode<T>[];
  totalCount: number;
}

export const parsePermissionCode = (code: string): PermissionHierarchyPath => {
  const segments = code
    .split(":")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return {
      group: "general",
      module: "general",
      submodule: DEFAULT_SUBMODULE,
      action: "read",
    };
  }

  if (segments.length === 1) {
    return {
      group: segments[0],
      module: "general",
      submodule: DEFAULT_SUBMODULE,
      action: "read",
    };
  }

  if (segments.length === 2) {
    return {
      group: segments[0],
      module: segments[1],
      submodule: DEFAULT_SUBMODULE,
      action: "read",
    };
  }

  if (segments.length === 3) {
    return {
      group: segments[0],
      module: segments[1],
      submodule: DEFAULT_SUBMODULE,
      action: segments[2],
    };
  }

  return {
    group: segments[0],
    module: segments[1],
    submodule: segments.slice(2, -1).join(":") || DEFAULT_SUBMODULE,
    action: segments[segments.length - 1],
  };
};

export const formatPermissionSegment = (segment: string) =>
  normalizeLabel(segment || DEFAULT_SUBMODULE);

export const comparePermissionCodesByHierarchy = (
  firstCode: string,
  secondCode: string,
) => {
  const firstPath = parsePermissionCode(firstCode);
  const secondPath = parsePermissionCode(secondCode);

  const groupComparison = compareLabels(firstPath.group, secondPath.group);
  if (groupComparison !== 0) return groupComparison;

  const moduleComparison = compareLabels(firstPath.module, secondPath.module);
  if (moduleComparison !== 0) return moduleComparison;

  const submoduleComparison = compareLabels(
    firstPath.submodule,
    secondPath.submodule,
  );
  if (submoduleComparison !== 0) return submoduleComparison;

  const actionPriorityComparison =
    getActionPriority(firstPath.action) - getActionPriority(secondPath.action);
  if (actionPriorityComparison !== 0) return actionPriorityComparison;

  return firstCode.localeCompare(secondCode, "es", { sensitivity: "base" });
};

export const buildPermissionHierarchy = <T>(
  entries: PermissionHierarchyEntry<T>[],
): PermissionHierarchyGroupNode<T>[] => {
  const groupMap = new Map<
    string,
    {
      key: string;
      group: string;
      modules: Map<
        string,
        {
          key: string;
          module: string;
          submodules: Map<
            string,
            {
              key: string;
              submodule: string;
              actions: PermissionHierarchyActionNode<T>[];
            }
          >;
        }
      >;
    }
  >();

  for (const entry of entries) {
    const path = parsePermissionCode(entry.code);
    const groupKey = normalizeSegment(path.group);
    const moduleKey = normalizeSegment(path.module);
    const submoduleKey = normalizeSegment(path.submodule);

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        key: groupKey,
        group: path.group,
        modules: new Map(),
      });
    }

    const groupNode = groupMap.get(groupKey);
    if (!groupNode) continue;

    if (!groupNode.modules.has(moduleKey)) {
      groupNode.modules.set(moduleKey, {
        key: `${groupKey}:${moduleKey}`,
        module: path.module,
        submodules: new Map(),
      });
    }

    const moduleNode = groupNode.modules.get(moduleKey);
    if (!moduleNode) continue;

    if (!moduleNode.submodules.has(submoduleKey)) {
      moduleNode.submodules.set(submoduleKey, {
        key: `${groupKey}:${moduleKey}:${submoduleKey}`,
        submodule: path.submodule,
        actions: [],
      });
    }

    const submoduleNode = moduleNode.submodules.get(submoduleKey);
    if (!submoduleNode) continue;

    submoduleNode.actions.push({
      ...entry,
      path,
    });
  }

  return Array.from(groupMap.values())
    .map((groupNode) => {
      const modules = Array.from(groupNode.modules.values())
        .map((moduleNode) => {
          const submodules = Array.from(moduleNode.submodules.values())
            .map((submoduleNode) => {
              const actions = [...submoduleNode.actions].sort(
                (first, second) => {
                  const actionPriorityComparison =
                    getActionPriority(first.path.action) -
                    getActionPriority(second.path.action);

                  if (actionPriorityComparison !== 0) {
                    return actionPriorityComparison;
                  }

                  return compareLabels(first.code, second.code);
                },
              );

              return {
                ...submoduleNode,
                actions,
                totalCount: actions.length,
              };
            })
            .sort((first, second) =>
              compareLabels(first.submodule, second.submodule),
            );

          const totalCount = submodules.reduce(
            (accumulator, currentSubmodule) =>
              accumulator + currentSubmodule.totalCount,
            0,
          );

          return {
            ...moduleNode,
            submodules,
            totalCount,
          };
        })
        .sort((first, second) => compareLabels(first.module, second.module));

      const totalCount = modules.reduce(
        (accumulator, currentModule) => accumulator + currentModule.totalCount,
        0,
      );

      return {
        ...groupNode,
        modules,
        totalCount,
      };
    })
    .sort((first, second) => compareLabels(first.group, second.group));
};
