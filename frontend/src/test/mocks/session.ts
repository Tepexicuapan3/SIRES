import type { AuthUser } from "@/api/types/auth.types";
import { createMockAuthUser } from "@/test/factories/users";

const createDefaultSessionUser = (): AuthUser =>
  createMockAuthUser({
    id: 999,
    username: "mock_admin",
    fullName: "Mock Admin",
    email: "mock.admin@sires.local",
    avatarUrl: null,
    landingRoute: "/dashboard",
    roles: ["Admin"],
    permissions: ["*"],
    mustChangePassword: false,
    requiresOnboarding: false,
  });

let mockSessionUser: AuthUser | null = null;

export const getMockSessionUser = () => mockSessionUser;

export const setMockSessionUser = (user: AuthUser | null) => {
  mockSessionUser = user;
};

export const clearMockSessionUser = () => {
  mockSessionUser = null;
};

export const resetMockSessionUser = () => {
  mockSessionUser = null;
};

export const seedMockAdminSession = () => {
  mockSessionUser = createDefaultSessionUser();
};

export const hasMockPermission = (permission: string) => {
  if (!mockSessionUser) return false;
  if (mockSessionUser.permissions.includes("*")) return true;
  return mockSessionUser.permissions.includes(permission);
};
