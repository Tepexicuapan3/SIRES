// @vitest-environment node
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { visitsAPI } from "@api/resources/visits.api";
import { ApiError } from "@api/utils/errors";
import { server } from "@/test/mocks/server";

const validPayload = {
  weightKg: 70,
  heightCm: 175,
  temperatureC: 36.6,
  oxygenSaturationPct: 98,
  waistCircumferenceCm: 95,
};

const expectApiError = async (
  promise: Promise<unknown>,
  expectation: { code: string; status: number },
) => {
  await expect(promise).rejects.toBeInstanceOf(ApiError);
  await expect(promise).rejects.toMatchObject(expectation);
};

describe("Capture vitals API integration (KAN-18)", () => {
  it("consume el endpoint /visits/{visitId}/vitals y retorna IMC", async () => {
    let receivedVisitId = "";

    server.use(
      http.post("*/visits/:visitId/vitals", async ({ params, request }) => {
        receivedVisitId = String(params.visitId);
        const body = (await request.json()) as typeof validPayload;

        return HttpResponse.json({
          visitId: Number(params.visitId),
          status: "lista_para_doctor",
          vitals: {
            ...body,
            bmi: 22.86,
          },
        });
      }),
    );

    const response = await visitsAPI.captureVitals(3001, validPayload);

    expect(receivedVisitId).toBe("3001");
    expect(response.visitId).toBe(3001);
    expect(response.status).toBe("lista_para_doctor");
    expect(response.vitals.bmi).toBe(22.86);
  });

  it.each([
    { code: "VITALS_INCOMPLETE", status: 409 },
    { code: "ROLE_NOT_ALLOWED", status: 403 },
    { code: "VISIT_STATE_INVALID", status: 409 },
  ])("propaga error de dominio $code", async ({ code, status }) => {
    server.use(
      http.post("*/visits/:visitId/vitals", () => {
        return HttpResponse.json(
          {
            code,
            message: code,
            status,
          },
          { status },
        );
      }),
    );

    const promise = visitsAPI.captureVitals(3002, validPayload);
    await expectApiError(promise, { code, status });
  });
});
