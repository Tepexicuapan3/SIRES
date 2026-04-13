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

describe("centrosAtencionAPI contract mapping", () => {
  const mockedApiClient = apiClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps backend code to folioCode for list response", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 1,
            name: "Centro Central",
            code: "CEN",
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
      folioCode: "CEN",
    });
  });

  it("maps create payload folioCode to backend code", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        id: 5,
        name: "Hospital Norte",
      },
    });

    await centrosAtencionAPI.create({
      name: "Hospital Norte",
      folioCode: "HNO",
      isExternal: true,
      address: "Av. Norte 120",
      schedule: {
        morning: { startsAt: "07:00", endsAt: "14:00" },
        afternoon: { startsAt: "14:00", endsAt: "20:00" },
        night: { startsAt: "20:00", endsAt: "23:00" },
      },
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/care-centers",
      expect.objectContaining({
        name: "Hospital Norte",
        code: "HNO",
      }),
    );
    expect(apiClient.post).not.toHaveBeenCalledWith(
      "/care-centers",
      expect.objectContaining({ folioCode: "HNO" }),
    );
  });

  it("maps backend code to folioCode for update response", async () => {
    mockedApiClient.put.mockResolvedValueOnce({
      data: {
        center: {
          id: 1,
          name: "Centro Central",
          code: "CC-001",
          isExternal: false,
          isActive: true,
          address: "Av. Central 100",
          schedule: {
            morning: { startsAt: "07:00", endsAt: "14:00" },
            afternoon: { startsAt: "14:00", endsAt: "20:00" },
            night: { startsAt: "20:00", endsAt: "23:00" },
          },
          createdAt: "2026-01-01T00:00:00Z",
          createdBy: { id: 1, name: "Admin" },
          updatedAt: null,
          updatedBy: null,
        },
      },
    });

    const response = await centrosAtencionAPI.update(1, {
      folioCode: "CC-001",
    });

    expect(response.center.folioCode).toBe("CC-001");
    expect(apiClient.put).toHaveBeenCalledWith(
      "/care-centers/1",
      expect.objectContaining({ code: "CC-001" }),
    );
  });
});
