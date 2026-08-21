import { describe, expect, it } from "vitest";
import {
  deriveModuleKey,
  slugify,
} from "@features/admin/modules/menus/domain/deriveModuleKey";

describe("slugify", () => {
  it("normaliza acentos y espacios a ascii minusculas con guion bajo", () => {
    expect(slugify("Área Clínica")).toBe("area_clinica");
    expect(slugify("  Vacunación   COVID  ")).toBe("vacunacion_covid");
  });

  it("colapsa corridas de caracteres no alfanumericos en un solo _", () => {
    expect(slugify("Autorización / Recetas!!")).toBe("autorizacion_recetas");
  });

  it("recorta _ sobrantes en los bordes", () => {
    expect(slugify("--Áreas--")).toBe("areas");
  });

  it("cae al default 'modulo' si el resultado queda vacio", () => {
    expect(slugify("")).toBe("modulo");
    expect(slugify("   ")).toBe("modulo");
    expect(slugify("###")).toBe("modulo");
  });
});

describe("deriveModuleKey", () => {
  it("antepone el parentKey con un punto cuando hay padre", () => {
    expect(
      deriveModuleKey({
        title: "Vacunas",
        parentKey: "farmacia.panel",
        existingKeys: [],
      }),
    ).toBe("farmacia.panel.vacunas");
  });

  it("no antepone nada si va a la raiz", () => {
    expect(
      deriveModuleKey({ title: "Vacunas", parentKey: null, existingKeys: [] }),
    ).toBe("vacunas");
  });

  it("desambigua colisiones con sufijo _2, _3...", () => {
    const existingKeys = new Set(["vacunas", "vacunas_2"]);
    expect(
      deriveModuleKey({ title: "Vacunas", parentKey: null, existingKeys }),
    ).toBe("vacunas_3");
  });

  it("acepta existingKeys como array ademas de Set", () => {
    expect(
      deriveModuleKey({
        title: "Vacunas",
        parentKey: null,
        existingKeys: ["vacunas"],
      }),
    ).toBe("vacunas_2");
  });
});
