import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

import { FLUJO_CLINICO_USERS, FlujoClinicoPage } from "./flujo-clinico-page";

const createPatientId = (): number => {
  return 910000 + ((Date.now() + Math.floor(Math.random() * 1000)) % 80000);
};

const createAppointmentId = (patientId: number): string => {
  return `APP-KAN19-${patientId}`;
};

const VISIBILITY_TIMEOUT = {
  timeout: 5_000,
  intervals: [200, 350, 500],
} as const;

test.describe("Flujo clinico excepciones", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "KAN19-E2E-001 visita cancelada no debe aparecer en colas clinicas",
    {
      tag: [
        "@critical",
        "@e2e",
        "@flujo-clinico",
        "@exceptions",
        "@KAN19-E2E-001",
      ],
    },
    async ({ browser }) => {
      const recepcionContext = await browser.newContext();
      const clinicoContext = await browser.newContext();

      try {
        const recepcionPage = new FlujoClinicoPage(
          await recepcionContext.newPage(),
        );
        await recepcionPage.login(FLUJO_CLINICO_USERS.recepcion);

        const patientId = createPatientId();
        const visit = await recepcionPage.registerArrival({
          patientId,
          appointmentId: createAppointmentId(patientId),
          doctorId: 121,
          notes: "KAN-19 cancelada exception",
        });

        const cancelResponse = await recepcionPage.updateVisitStatus(
          visit.id,
          "cancelada",
        );
        const cancelPayload = await cancelResponse.json().catch(() => null);

        expect(
          cancelResponse.status(),
          `No se pudo marcar cancelada: ${JSON.stringify(cancelPayload)}`,
        ).toBe(200);
        expect(cancelPayload?.status).toBe("cancelada");

        const clinicoPage = new FlujoClinicoPage(
          await clinicoContext.newPage(),
        );
        await clinicoPage.login(FLUJO_CLINICO_USERS.clinico);

        await clinicoPage.gotoSomatometriaQueue();
        await expect
          .poll(
            async () =>
              clinicoPage.isVisitVisible("#visit-selector", visit.folio),
            VISIBILITY_TIMEOUT,
          )
          .toBe(false);

        await clinicoPage.gotoDoctorQueue();
        await expect
          .poll(
            async () =>
              clinicoPage.isVisitVisible("#doctor-visit-selector", visit.folio),
            VISIBILITY_TIMEOUT,
          )
          .toBe(false);
      } finally {
        await recepcionContext.close();
        await clinicoContext.close();
      }
    },
  );

  test(
    "KAN19-E2E-002 visita no_show no debe aparecer en colas clinicas",
    {
      tag: [
        "@critical",
        "@e2e",
        "@flujo-clinico",
        "@exceptions",
        "@KAN19-E2E-002",
      ],
    },
    async ({ browser }) => {
      const recepcionContext = await browser.newContext();
      const clinicoContext = await browser.newContext();

      try {
        const recepcionPage = new FlujoClinicoPage(
          await recepcionContext.newPage(),
        );
        await recepcionPage.login(FLUJO_CLINICO_USERS.recepcion);

        const patientId = createPatientId();
        const visit = await recepcionPage.registerArrival({
          patientId,
          appointmentId: createAppointmentId(patientId),
          doctorId: 121,
          notes: "KAN-19 no_show exception",
        });

        const noShowResponse = await recepcionPage.updateVisitStatus(
          visit.id,
          "no_show",
        );
        const noShowPayload = await noShowResponse.json().catch(() => null);

        expect(
          noShowResponse.status(),
          `No se pudo marcar no_show: ${JSON.stringify(noShowPayload)}`,
        ).toBe(200);
        expect(noShowPayload?.status).toBe("no_show");

        const clinicoPage = new FlujoClinicoPage(
          await clinicoContext.newPage(),
        );
        await clinicoPage.login(FLUJO_CLINICO_USERS.clinico);

        await clinicoPage.gotoSomatometriaQueue();
        await expect
          .poll(
            async () =>
              clinicoPage.isVisitVisible("#visit-selector", visit.folio),
            VISIBILITY_TIMEOUT,
          )
          .toBe(false);

        await clinicoPage.gotoDoctorQueue();
        await expect
          .poll(
            async () =>
              clinicoPage.isVisitVisible("#doctor-visit-selector", visit.folio),
            VISIBILITY_TIMEOUT,
          )
          .toBe(false);
      } finally {
        await recepcionContext.close();
        await clinicoContext.close();
      }
    },
  );

  test(
    "KAN19-E2E-003 transicion invalida devuelve VISIT_STATE_INVALID",
    {
      tag: [
        "@critical",
        "@e2e",
        "@flujo-clinico",
        "@exceptions",
        "@KAN19-E2E-003",
      ],
    },
    async ({ browser }) => {
      const recepcionContext = await browser.newContext();

      try {
        const recepcionPage = new FlujoClinicoPage(
          await recepcionContext.newPage(),
        );
        await recepcionPage.login(FLUJO_CLINICO_USERS.recepcion);

        const patientId = createPatientId();
        const visit = await recepcionPage.registerArrival({
          patientId,
          appointmentId: createAppointmentId(patientId),
          doctorId: 121,
          notes: "KAN-19 invalid transition",
        });

        const moveResponse = await recepcionPage.moveVisitToSomatometria(
          visit.id,
        );
        const movePayload = await moveResponse.json().catch(() => null);
        expect(
          moveResponse.status(),
          `No se pudo mover a somatometria: ${JSON.stringify(movePayload)}`,
        ).toBe(200);

        const invalidResponse = await recepcionPage.updateVisitStatus(
          visit.id,
          "cancelada",
        );
        const invalidPayload = await invalidResponse.json().catch(() => null);

        expect(
          invalidResponse.status(),
          `Se esperaba 409 en transicion invalida: ${JSON.stringify(invalidPayload)}`,
        ).toBe(409);
        expect(invalidPayload?.code).toBe("VISIT_STATE_INVALID");
      } finally {
        await recepcionContext.close();
      }
    },
  );

  test(
    "KAN19-E2E-004 rol no autorizado bloqueado por guard de ruta",
    {
      tag: [
        "@critical",
        "@e2e",
        "@flujo-clinico",
        "@exceptions",
        "@KAN19-E2E-004",
      ],
    },
    async ({ browser }) => {
      const recepcionContext = await browser.newContext();

      try {
        const page = await recepcionContext.newPage();
        const recepcionPage = new FlujoClinicoPage(page);
        await recepcionPage.login(FLUJO_CLINICO_USERS.recepcion);

        await page.goto("/clinico/consultas/doctor", {
          waitUntil: "domcontentloaded",
        });

        await expect(
          page.getByRole("heading", { name: "Acceso Denegado" }),
        ).toBeVisible();
        await expect(
          page.getByText(
            "No tienes permisos suficientes para acceder a esta seccion.",
          ),
        ).toBeVisible();
      } finally {
        await recepcionContext.close();
      }
    },
  );

  test(
    "KAN19-E2E-005 quality gate release incluye suite completa y fail-fast",
    {
      tag: [
        "@critical",
        "@e2e",
        "@flujo-clinico",
        "@quality-gate",
        "@KAN19-E2E-005",
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

      const e2eKan4Script = packageJson.scripts?.["test:e2e:kan4"] ?? "";
      expect(e2eKan4Script).toContain("flujo-clinico-smoke.e2e.ts");
      expect(e2eKan4Script).toContain("flujo-clinico-excepciones.e2e.ts");
      expect(e2eKan4Script).toContain("--max-failures=1");

      const qualityReleaseScript =
        packageJson.scripts?.["quality:kan4:release"] ?? "";
      expect(qualityReleaseScript).toContain("bun run test:run");
      expect(qualityReleaseScript).toContain("bun run test:e2e:kan4");
      expect(qualityReleaseScript).toContain("&&");
    },
  );
});
