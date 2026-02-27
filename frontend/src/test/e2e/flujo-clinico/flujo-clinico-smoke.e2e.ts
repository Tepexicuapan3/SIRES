import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { FLUJO_CLINICO_USERS, FlujoClinicoPage } from "./flujo-clinico-page";

const createPatientId = (): number => {
  return 900000 + (Date.now() % 90000);
};

const createAppointmentId = (patientId: number): string => {
  return `APP-KAN27-${patientId}`;
};

test.describe("Flujo clinico smoke", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "KAN27-E2E-001 camino feliz recepcion -> somatometria -> doctor -> cierre",
    {
      tag: ["@critical", "@e2e", "@flujo-clinico", "@smoke", "@KAN27-E2E-001"],
    },
    async ({ browser }) => {
      const recepcionContext = await browser.newContext();

      try {
        const recepcionPage = new FlujoClinicoPage(
          await recepcionContext.newPage(),
        );
        await recepcionPage.login(FLUJO_CLINICO_USERS.recepcion);

        const patientId = createPatientId();
        const createdVisit = await recepcionPage.registerArrival({
          patientId,
          appointmentId: createAppointmentId(patientId),
          doctorId: 121,
          notes: "KAN-27 happy path smoke",
        });

        const moveToSomatometriaResponse =
          await recepcionPage.moveVisitToSomatometria(createdVisit.id);
        const moveToSomatometriaStatus = moveToSomatometriaResponse.status();
        const moveToSomatometriaPayload = await moveToSomatometriaResponse
          .json()
          .catch(() => null);
        expect(
          moveToSomatometriaStatus,
          `No se pudo mover visita a somatometria: ${JSON.stringify(moveToSomatometriaPayload)}`,
        ).toBe(200);

        const clinicoContext = await browser.newContext();
        try {
          const clinicoPage = new FlujoClinicoPage(
            await clinicoContext.newPage(),
          );
          await clinicoPage.login(FLUJO_CLINICO_USERS.clinico);

          await clinicoPage.captureVitals(createdVisit.folio);
          await clinicoPage.startConsultation(createdVisit.folio);
          await clinicoPage.saveDiagnosis({
            primaryDiagnosis: "Dolor lumbar inespecifico",
            finalNote: "Paciente estable, egreso con indicaciones generales.",
          });
          await clinicoPage.savePrescription({
            items: [
              "Paracetamol 500mg cada 8h por 3 dias",
              "Reposo relativo y ejercicios de estiramiento lumbar",
            ],
          });
          await clinicoPage.closeConsultation({
            primaryDiagnosis: "Dolor lumbar inespecifico",
            finalNote: "Paciente estable, egreso con indicaciones generales.",
          });

          await expect
            .poll(
              async () => {
                return clinicoPage.isVisitVisible(
                  "#doctor-visit-selector",
                  createdVisit.folio,
                );
              },
              {
                timeout: 10_000,
                intervals: [200, 350, 500],
              },
            )
            .toBe(false);
        } finally {
          await clinicoContext.close();
        }
      } finally {
        await recepcionContext.close();
      }
    },
  );

  test(
    "KAN27-E2E-002 realtime smoke websocket actualiza sin refresh manual",
    {
      tag: [
        "@critical",
        "@e2e",
        "@flujo-clinico",
        "@realtime",
        "@smoke",
        "@KAN27-E2E-002",
      ],
    },
    async ({ browser }) => {
      const actorAContext = await browser.newContext();
      const actorBContext = await browser.newContext();
      const actorCContext = await browser.newContext();

      try {
        const actorA = new FlujoClinicoPage(await actorAContext.newPage());
        const actorB = new FlujoClinicoPage(await actorBContext.newPage());
        const actorC = new FlujoClinicoPage(await actorCContext.newPage());

        await actorA.login(FLUJO_CLINICO_USERS.recepcion);
        await actorB.login(FLUJO_CLINICO_USERS.clinico);
        await actorC.login(FLUJO_CLINICO_USERS.clinico);

        await actorB.gotoSomatometriaQueue();
        await actorC.gotoDoctorQueue();

        const navigationEntriesBefore = await actorB.getNavigationEntryCount();
        const doctorNavigationEntriesBefore =
          await actorC.getNavigationEntryCount();

        const patientId = createPatientId();
        const createdVisit = await actorA.registerArrival({
          patientId,
          appointmentId: createAppointmentId(patientId),
          doctorId: 121,
          notes: "KAN-27 realtime smoke",
        });

        const realtimeStartAt = Date.now();
        const moveToSomatometriaResponse = await actorA.moveVisitToSomatometria(
          createdVisit.id,
        );
        const moveToSomatometriaStatus = moveToSomatometriaResponse.status();
        const moveToSomatometriaPayload = await moveToSomatometriaResponse
          .json()
          .catch(() => null);
        expect(
          moveToSomatometriaStatus,
          `No se pudo mover visita a somatometria: ${JSON.stringify(moveToSomatometriaPayload)}`,
        ).toBe(200);

        await actorB.waitForVisitOption(
          "#visit-selector",
          createdVisit.folio,
          5_000,
        );

        const realtimeLatencyMs = Date.now() - realtimeStartAt;
        expect(realtimeLatencyMs).toBeLessThanOrEqual(5_000);

        const navigationEntriesAfter = await actorB.getNavigationEntryCount();
        expect(navigationEntriesAfter).toBe(navigationEntriesBefore);

        const doctorRealtimeStartAt = Date.now();
        await actorB.captureVitals(createdVisit.folio);

        await actorC.waitForVisitOption(
          "#doctor-visit-selector",
          createdVisit.folio,
          5_000,
        );

        const doctorRealtimeLatencyMs = Date.now() - doctorRealtimeStartAt;
        expect(doctorRealtimeLatencyMs).toBeLessThanOrEqual(5_000);

        const doctorNavigationEntriesAfter =
          await actorC.getNavigationEntryCount();
        expect(doctorNavigationEntriesAfter).toBe(
          doctorNavigationEntriesBefore,
        );
      } finally {
        await actorAContext.close();
        await actorBContext.close();
        await actorCContext.close();
      }
    },
  );

  test(
    "KAN27-E2E-003 quality gate minimo definido para bloquear regresiones criticas",
    {
      tag: [
        "@critical",
        "@e2e",
        "@flujo-clinico",
        "@quality-gate",
        "@KAN27-E2E-003",
      ],
    },
    async () => {
      const packageJsonPath = new URL(
        "../../../../package.json",
        import.meta.url,
      );
      const packageJsonRaw = await readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(packageJsonRaw) as {
        scripts?: Record<string, string>;
      };

      const e2eSmokeScript = packageJson.scripts?.["test:e2e:smoke"] ?? "";
      expect(e2eSmokeScript).toContain(
        "playwright test src/test/e2e/flujo-clinico/flujo-clinico-smoke.e2e.ts --config=playwright.smoke.docker.config.mjs --project=chromium",
      );

      const qualityGateScript =
        packageJson.scripts?.["quality:kan4:smoke"] ?? "";
      expect(qualityGateScript).toContain("bun run test:run");
      expect(qualityGateScript).toContain("bun run test:e2e:smoke");
      expect(qualityGateScript).toContain("&&");
    },
  );
});
