import { expect, test } from "@playwright/test";

import { FLUJO_CLINICO_USERS, FlujoClinicoPage } from "./flujo-clinico-page";

const createNoExp = (): string => {
  return String(930000 + (Date.now() % 60000));
};

const createAppointmentId = (noExp: string): string => {
  return `APP-EDIT-${noExp}`;
};

interface CaptureVitalsResponseBody {
  status?: string;
  vitals?: {
    weightKg?: number;
    updatedBy?: { id: number; nombre: string | null } | null;
  };
}

interface EditVitalsResponseBody {
  visitId?: number;
  vitals?: {
    weightKg?: number;
    updatedBy?: { id: number; nombre: string | null } | null;
  };
}

/**
 * Change: somatometria-modulo-integral (Fase 3 + Fase 4a, task 3.12).
 *
 * Cubre el escenario end-to-end de la edicion auditada: una vez que un
 * paciente tiene signos vitales capturados, corregirlos vía
 * `PATCH /visits/{id}/vitals` deja el aviso "Corregido por {usuario}"
 * visible para el medico en `ConsultationDetailDialog` -- un valor
 * corregido nunca se presenta como si fuera el original.
 *
 * Nota de alcance: las tasks 3.5-3.7 (aplicadas en este mismo change)
 * cubren el hook `useEditVitals` y el aviso de UI en
 * `ConsultationDetailDialog`, pero NO incluyen un formulario/dialogo
 * dedicado para disparar la correccion desde la bandeja de somatometria
 * (no es parte de la lista de 12 tasks de Fase 3). Este test, siguiendo
 * el mismo patron ya establecido por
 * `flujo-clinico-reuso-vitales.e2e.ts` (que usa `captureVitalsByVisitId`
 * como helper de API para preparar el escenario), dispara la correccion
 * via API (`editVitalsByVisitId`) y verifica el resultado real en la UI
 * del medico -- que es, en definitiva, el requisito de negocio
 * (spec `consulta-medica/vitals-display`).
 */
test.describe("Flujo clinico - edicion auditada de signos vitales", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "KAN-EDIT-E2E-001 se corrigen los vitales y el medico ve quien corrigio",
    {
      tag: ["@e2e", "@flujo-clinico", "@somatometria", "@edicion-vitales"],
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

        const visit = await recepcionPage.registerArrival({
          noExp,
          appointmentId: createAppointmentId(noExp),
        });

        const moveResponse = await recepcionPage.moveVisitToSomatometria(
          visit.id,
        );
        expect(
          moveResponse.status,
          `No se pudo mover la visita a somatometria: ${JSON.stringify(moveResponse.body)}`,
        ).toBe(200);

        const clinicoPage = new FlujoClinicoPage(
          await clinicoContext.newPage(),
        );
        await clinicoPage.login(FLUJO_CLINICO_USERS.clinico);

        // Captura inicial (equivalente al camino ya cubierto por el smoke
        // test de captura por UI -- aca solo se necesita una fila
        // existente para poder corregirla).
        const captureResponse = await clinicoPage.captureVitalsByVisitId(
          visit.id,
          {
            weightKg: 70,
            heightCm: 172,
            temperatureC: 36.6,
            oxygenSaturationPct: 98,
            notes: "captura e2e edicion - valor original",
          },
        );
        const capturePayload =
          captureResponse.body as CaptureVitalsResponseBody | null;
        expect(
          captureResponse.status,
          `No se pudo capturar vitales: ${JSON.stringify(capturePayload)}`,
        ).toBe(200);
        expect(capturePayload?.vitals?.updatedBy).toBeNull();

        // Correccion auditada: el usuario CLINICO tiene tanto
        // `clinico:somatometria:read` como `clinico:somatometria:update`
        // (seed_e2e.py, rol CLINICO), asi que la misma sesion puede
        // corregir su propia captura -- lo relevante para este test es
        // el contrato PATCH + la UI del medico, no la separacion
        // organizacional de roles (ya cubierta a nivel unitario/API en
        // `test_vitals_edit_api.py::VitalsEditPermissionTests`).
        const editResponse = await clinicoPage.editVitalsByVisitId(visit.id, {
          weightKg: 72,
          heightCm: 172,
          temperatureC: 36.8,
          oxygenSaturationPct: 97,
          notes: "captura e2e edicion - valor corregido",
          motivo: "Bascula mal calibrada en la primera toma",
        });
        const editPayload = editResponse.body as EditVitalsResponseBody | null;
        expect(
          editResponse.status,
          `No se pudo corregir los vitales: ${JSON.stringify(editPayload)}`,
        ).toBe(200);
        expect(editPayload?.vitals?.weightKg).toBe(72);
        expect(editPayload?.vitals?.updatedBy).toBeTruthy();

        // El medico ve el aviso de correccion, no el valor presentado
        // como si fuera el original.
        await clinicoPage.openDoctorConsultationModal(visit.folio);
        await clinicoPage.assertVitalsShowsCorrectedBy(/\w+/);
      } finally {
        await recepcionContext.close();
        await clinicoContext.close();
      }
    },
  );
});
