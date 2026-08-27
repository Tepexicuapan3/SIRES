import { expect, test } from "@playwright/test";

import { FLUJO_CLINICO_USERS, FlujoClinicoPage } from "./flujo-clinico-page";

const createNoExp = (): string => {
  return String(920000 + (Date.now() % 70000));
};

const createAppointmentId = (noExp: string, suffix: string): string => {
  return `APP-REUSO-${noExp}-${suffix}`;
};

interface CaptureVitalsResponseBody {
  status?: string;
  vitals?: {
    capturedAt?: string;
    reusedFromVisitId?: number | null;
  };
}

/**
 * Change: somatometria-reuso-signos-mismo-dia (Fase 3).
 *
 * Cubre el escenario end-to-end de reuso: la misma persona tiene dos
 * visitas el mismo dia (folio A ya con vitales capturados, folio B recien
 * llegado a somatometria). La enfermera ve el aviso de reuso en el folio B
 * (nunca preseleccionado), elige "Reusar", el formulario se precarga pero
 * sigue siendo editable, y al guardar el servidor registra `reusedFromVisitId`
 * apuntando a la visita origen sin fusionar ni omitir la fila nueva
 * (NOM-024). Despues valida que el medico ve `capturedAt` + el aviso de
 * reuso en `ConsultationDetailDialog`.
 */
test.describe("Flujo clinico - reuso de signos vitales del mismo dia", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "KAN-REUSO-E2E-001 enfermera reusa captura de hoy y el medico ve el origen",
    {
      tag: ["@e2e", "@flujo-clinico", "@somatometria", "@reuso-vitales"],
    },
    async ({ browser }) => {
      const recepcionContext = await browser.newContext();
      const clinicoContext = await browser.newContext();

      try {
        const recepcionPage = new FlujoClinicoPage(
          await recepcionContext.newPage(),
        );
        await recepcionPage.login(FLUJO_CLINICO_USERS.recepcion);

        const noExp = createNoExp();

        // Visita A: se captura y se cierra la etapa de somatometria via API
        // (el camino de captura por UI ya esta cubierto por el smoke test;
        // aca solo necesitamos que exista una captura de HOY para la misma
        // persona, para poder ofrecer el reuso en la visita B).
        const visitA = await recepcionPage.registerArrival({
          noExp,
          appointmentId: createAppointmentId(noExp, "A"),
        });

        const moveAResponse =
          await recepcionPage.moveVisitToSomatometria(visitA.id);
        expect(
          moveAResponse.status,
          `No se pudo mover la visita A a somatometria: ${JSON.stringify(moveAResponse.body)}`,
        ).toBe(200);

        const captureAResponse = await recepcionPage.captureVitalsByVisitId(
          visitA.id,
          {
            weightKg: 71,
            heightCm: 172,
            temperatureC: 36.7,
            oxygenSaturationPct: 97,
            notes: "captura e2e reuso - visita origen",
          },
        );
        const captureAPayload =
          captureAResponse.body as CaptureVitalsResponseBody | null;
        expect(
          captureAResponse.status,
          `No se pudo capturar vitales de la visita A: ${JSON.stringify(captureAPayload)}`,
        ).toBe(200);

        // Visita B: misma persona (mismo noExp), otra visita, mismo dia.
        const visitB = await recepcionPage.registerArrival({
          noExp,
          appointmentId: createAppointmentId(noExp, "B"),
        });

        const moveBResponse =
          await recepcionPage.moveVisitToSomatometria(visitB.id);
        expect(
          moveBResponse.status,
          `No se pudo mover la visita B a somatometria: ${JSON.stringify(moveBResponse.body)}`,
        ).toBe(200);

        // La enfermera abre somatometria, ve el aviso de reuso para la
        // visita B (nunca preseleccionado) y decide reusar.
        const clinicoPage = new FlujoClinicoPage(
          await clinicoContext.newPage(),
        );
        await clinicoPage.login(FLUJO_CLINICO_USERS.clinico);

        const reuseResponse = await clinicoPage.captureVitalsWithReuseDecision(
          visitB.folio,
          "reuse",
        );
        const reusePayload =
          reuseResponse.body as CaptureVitalsResponseBody | null;
        expect(
          reuseResponse.status,
          `No se pudo guardar el reuso de vitales para la visita B: ${JSON.stringify(reusePayload)}`,
        ).toBe(200);
        expect(reusePayload?.status).toBe("lista_para_doctor");
        expect(reusePayload?.vitals?.reusedFromVisitId).toBe(visitA.id);
        expect(reusePayload?.vitals?.capturedAt).toBeTruthy();

        // El medico ve el momento de captura y el aviso de reuso.
        await clinicoPage.openDoctorConsultationModal(visitB.folio);
        await clinicoPage.assertVitalsCapturedAtIndicatesReuse(true);
      } finally {
        await recepcionContext.close();
        await clinicoContext.close();
      }
    },
  );
});
