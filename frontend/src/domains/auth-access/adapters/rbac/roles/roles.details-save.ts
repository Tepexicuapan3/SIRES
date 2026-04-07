import type { UpdateRoleRequest } from "@api/types";

interface RoleDetailsSavePlan {
  rolePayload: UpdateRoleRequest;
  permissionsDirty: boolean;
  permissionIds: number[];
}

interface RoleDetailsSaveExecutors {
  updateRole: (payload: UpdateRoleRequest) => Promise<unknown>;
  assignPermissions: (permissionIds: number[]) => Promise<unknown>;
}

export const hasRoleDetailsChanges = (plan: RoleDetailsSavePlan) => {
  return Object.keys(plan.rolePayload).length > 0 || plan.permissionsDirty;
};

export const applyRoleDetailsSavePlan = async (
  plan: RoleDetailsSavePlan,
  executors: RoleDetailsSaveExecutors,
) => {
  let completedGroups = 0;

  if (Object.keys(plan.rolePayload).length > 0) {
    await executors.updateRole(plan.rolePayload);
    completedGroups += 1;
  }

  if (plan.permissionsDirty) {
    await executors.assignPermissions(plan.permissionIds);
    completedGroups += 1;
  }

  return completedGroups;
};
