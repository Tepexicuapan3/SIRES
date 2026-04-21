import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@api/client";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";

vi.mock("@api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("centrosAtencionAPI", () => {
  const mockedApiClient = apiClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll returns list with correct fields", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 1,
            name: "Centro Central",
            code: "DFCEN001",
            centerType: "CLINICA",
            legacyFolio: "CEN",
            isExternal: false,
            isActive: true,
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
    });

    const response = await centrosAtencionAPI.getAll();

    expect(response.items[0]).toMatchObject({
      id: 1,
      name: "Centro Central",
      code: "DFCEN001",
      legacyFolio: "CEN",
    });
  });

  it("create sends correct payload with code and centerType", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        careCenter: {
          id: 5,
          name: "Hospital Norte",
          code: "DFHOR001",
          centerType: "HOSPITAL",
          legacyFolio: null,
          isExternal: true,
          isActive: true,
        },
      },
    });

    await centrosAtencionAPI.create({
      name: "Hospital Norte",
      code: "DFHOR001",
      centerType: "HOSPITAL",
      isExternal: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringContaining("care-centers"),
      expect.objectContaining({
        name: "Hospital Norte",
        code: "DFHOR001",
        centerType: "HOSPITAL",
      }),
    );
  });

  it("update sends correct payload and returns careCenter", async () => {
    const updatedCenter = {
      id: 1,
      name: "Centro Central Actualizado",
      code: "DFCEN001",
      centerType: "CLINICA" as const,
      legacyFolio: "CEN",
      isExternal: false,
      isActive: true,
      address: "Av. Central 100",
      postalCode: "06600",
      neighborhood: "Centro",
      municipality: "Cuauhtémoc",
      state: "Ciudad de México",
      city: "Ciudad de México",
      phone: null,
      createdAt: "2026-01-01T00:00:00Z",
      createdBy: { id: 1, name: "Admin" },
      updatedAt: "2026-04-20T00:00:00Z",
      updatedBy: { id: 1, name: "Admin" },
    };

    mockedApiClient.put.mockResolvedValueOnce({
      data: { careCenter: updatedCenter },
    });

    const response = await centrosAtencionAPI.update(1, {
      name: "Centro Central Actualizado",
    });

    expect(response.careCenter.id).toBe(1);
    expect(apiClient.put).toHaveBeenCalledWith(
      expect.stringContaining("care-centers/1"),
      expect.objectContaining({ name: "Centro Central Actualizado" }),
    );
  });
});
