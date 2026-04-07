export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  capabilities: () => [...authKeys.all, "capabilities"] as const,
};
