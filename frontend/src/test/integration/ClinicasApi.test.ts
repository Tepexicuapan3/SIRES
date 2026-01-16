import { describe, it, expect } from "vitest";
import { clinicasAPI } from "@/api/resources/clinicas.api";

describe("Clinicas API Integration (with MSW)", () => {
  it("should fetch list of clinicas successfully", async () => {
    const clinicas = await clinicasAPI.getClinicas();

    // Validar que recibimos un array
    expect(Array.isArray(clinicas)).toBe(true);
    expect(clinicas.length).toBeGreaterThan(0);

    // Validar estructura del primer elemento
    const firstClinica = clinicas[0];
    expect(firstClinica).toHaveProperty("id_clin");
    expect(firstClinica).toHaveProperty("clinica");
    expect(firstClinica).toHaveProperty("folio_clin");
  });

  it("should contain the known test clinica", async () => {
    const clinicas = await clinicasAPI.getClinicas();
    
    const testClinica = clinicas.find(c => c.id_clin === 1);
    expect(testClinica).toBeDefined();
    expect(testClinica?.clinica).toBe("CLÍNICA CENTRAL DE PRUEBA");
  });
});
