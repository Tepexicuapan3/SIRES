import { describe, expect, it } from "vitest";
import {
  createRoleSchema,
  roleDetailsSchema,
} from "@/domains/auth-access/types/rbac/roles.schemas";

describe("roles.schemas", () => {
  it("validates required fields for create role", () => {
    const result = createRoleSchema.safeParse({
      name: "",
      description: "",
      landingRoute: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("Nombre requerido");
      expect(messages).toContain("Descripcion requerida");
    }
  });

  it("accepts valid role details", () => {
    const result = roleDetailsSchema.safeParse({
      name: "AUDITORIA",
      description: "Rol auditoria",
      landingRoute: "/admin/auditoria",
    });

    expect(result.success).toBe(true);
  });
});
