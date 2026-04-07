import { describe, expect, it } from "vitest";
import {
  createUserSchema,
  userDetailsSchema,
} from "@/domains/auth-access/types/rbac/users.schemas";

describe("users.schemas", () => {
  it("validates required fields for create user", () => {
    const result = createUserSchema.safeParse({
      username: "",
      firstName: "",
      paternalName: "",
      maternalName: "",
      email: "",
      clinicId: null,
      primaryRoleId: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("Usuario requerido");
      expect(messages).toContain("Nombre requerido");
      expect(messages).toContain("Apellido paterno requerido");
      expect(messages).toContain("Correo invalido");
      expect(messages).toContain("Selecciona un rol");
    }
  });

  it("parses optional clinic values", () => {
    const result = createUserSchema.safeParse({
      username: "jperez",
      firstName: "Juan",
      paternalName: "Perez",
      maternalName: "",
      email: "jperez@metro.cdmx.gob.mx",
      clinicId: null,
      primaryRoleId: 2,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clinicId).toBeNull();
    }
  });

  it("accepts valid user details updates", () => {
    const result = userDetailsSchema.safeParse({
      firstName: "Maria",
      paternalName: "Lopez",
      maternalName: "Diaz",
      email: "mlopez@metro.cdmx.gob.mx",
      clinicId: 1,
    });

    expect(result.success).toBe(true);
  });
});
