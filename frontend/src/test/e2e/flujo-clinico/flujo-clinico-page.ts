import { expect, type Page } from "@playwright/test";
import type { HttpJsonResponse } from "../shared/http-json-response";

const DEFAULT_TIMEOUT_MS = 15_000;
const DOCTOR_QUEUE_KEY = "doctor-open-consultations";
const DOCTOR_VISIT_CARD_TESTID_PREFIX = "doctor-visit-card-";

export const FLUJO_CLINICO_USERS = {
  recepcion: { username: "recepcion", password: "Sisem_123456" },
  clinico: { username: "clinico", password: "Sisem_123456" },
} as const;

export const DEFAULT_VITALS_INPUT = {
  weightKg: "70",
  heightCm: "172",
  temperatureC: "36.6",
  oxygenSaturationPct: "98",
  heartRateBpm: "76",
  respiratoryRateBpm: "16",
  notes: "captura e2e flujo clinico",
} as const;

export interface VisitRecord {
  id: number;
  folio: string;
  status: string;
}

interface RegisterArrivalInput {
  patientId: number;
  appointmentId: string;
  doctorId?: number;
  notes?: string;
}

interface CloseConsultationInput {
  primaryDiagnosis: string;
  finalNote: string;
}

interface CaptureVitalsByVisitIdInput {
  weightKg: number;
  heightCm: number;
  temperatureC: number;
  oxygenSaturationPct: number;
  heartRateBpm?: number;
  respiratoryRateBpm?: number;
  notes?: string;
}

interface SavePrescriptionInput {
  items: string[];
}

type VisitStatusTransitionTarget = "en_somatometria" | "cancelada" | "no_show";

type QueueStatusTarget =
  | "en_somatometria"
  | "lista_para_doctor"
  | "en_consulta";

interface VisitQueueVitals {
  weightKg?: number | null;
  heightCm?: number | null;
  temperatureC?: number | null;
  oxygenSaturationPct?: number | null;
}

interface VisitQueueRecord {
  id: number;
  folio: string;
  status: string;
  vitals?: VisitQueueVitals | null;
}

interface VisitQueueResponse {
  items?: VisitQueueRecord[];
}

type Credentials = {
  username: string;
  password: string;
};

export class FlujoClinicoPage {
  constructor(private readonly page: Page) {}

  async login(credentials: Credentials): Promise<void> {
    await this.page.goto("/login", { waitUntil: "domcontentloaded" });
    const usernameInput = this.page.getByLabel("No. Expediente o Usuario");
    const passwordInput = this.page.locator("input#password");
    const submitButton = this.page.getByRole("button", {
      name: "Iniciar Sesión",
    });

    const hasLoginForm = await usernameInput
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    if (!hasLoginForm) {
      await this.page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await this.page.goto("/login", { waitUntil: "domcontentloaded" });
    }

    await expect(usernameInput).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });
    await expect(passwordInput).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });
    await expect(submitButton).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });

    await usernameInput.fill(credentials.username);
    await passwordInput.fill(credentials.password);

    const [loginResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/auth/login") &&
          response.request().method() === "POST",
      ),
      submitButton.click(),
    ]);

    const loginPayload = (await loginResponse.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    expect(
      loginResponse.status(),
      `Login falló para '${credentials.username}': ${JSON.stringify(loginPayload)}`,
    ).toBe(200);

    await expect
      .poll(async () => new URL(this.page.url()).pathname, {
        timeout: DEFAULT_TIMEOUT_MS,
        intervals: [200, 350, 500],
      })
      .not.toContain("/login");
  }

  async gotoRecepcionQueue(): Promise<void> {
    await this.page.goto("/recepcion/checkin", {
      waitUntil: "domcontentloaded",
    });
    await expect(this.page).toHaveURL(/\/recepcion\/agenda(\?.*)?$/);
    await expect(
      this.page.getByRole("button", {
        name: /Generar ficha de consulta/i,
      }),
      "No se encontro la accion principal de recepcion",
    ).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });
  }

  async gotoRecepcionAgendarCita(): Promise<boolean> {
    const candidateRoutes = [
      "/recepcion/checkin",
      "/recepcion/agenda",
      "/recepcion/agendar-cita",
      "/recepcion/agenda?focus=checkin",
    ] as const;

    let foundRoute = false;
    for (const route of candidateRoutes) {
      await this.page.goto(route, { waitUntil: "domcontentloaded" });

      const hasCheckinUi = await this.page
        .waitForFunction(
          () => {
            const hasPrimaryAction = Array.from(
              document.querySelectorAll("button"),
            ).some((button) =>
              /Generar ficha de consulta/i.test(button.textContent ?? ""),
            );

            const hasInlineInputs =
              document.querySelector("#patientId") !== null ||
              document.querySelector("#quick-patientId") !== null;

            const hasLabeledInput =
              document.querySelector('label[for="patientId"]') !== null ||
              document.querySelector('label[for="quick-patientId"]') !== null;

            return hasPrimaryAction || hasInlineInputs || hasLabeledInput;
          },
          null,
          {
            timeout: 5_000,
          },
        )
        .then(() => true)
        .catch(() => false);

      if (!hasCheckinUi) {
        continue;
      }

      const primaryAction = this.page
        .getByRole("button", {
          name: /Generar ficha de consulta/i,
        })
        .first();
      const hasPrimaryAction = (await primaryAction.count()) > 0;
      const hasInlineForm =
        (await this.page.locator("#patientId, #quick-patientId").count()) > 0 ||
        (await this.page.getByLabel("ID paciente").count()) > 0;

      if (hasPrimaryAction || hasInlineForm) {
        if (hasPrimaryAction) {
          await expect(primaryAction).toBeVisible({
            timeout: DEFAULT_TIMEOUT_MS,
          });
        }
        foundRoute = true;
        break;
      }
    }

    if (!foundRoute) {
      return false;
    }

    let patientIdField = this.page.locator("#quick-patientId").first();
    if ((await patientIdField.count()) === 0) {
      patientIdField = this.page.getByLabel("ID paciente").first();
    }

    if (
      (await patientIdField.count()) === 0 ||
      !(await patientIdField.isVisible())
    ) {
      await this.page
        .getByRole("button", {
          name: /Generar ficha de consulta/i,
        })
        .first()
        .click();

      await expect(
        this.page.getByRole("dialog").getByText("Generar ficha de consulta"),
      ).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });

      patientIdField = this.page.locator("#quick-patientId").first();
    }

    await expect(patientIdField).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });
    return true;
  }

  async gotoSomatometriaQueue(): Promise<void> {
    await this.page.goto("/clinico/somatometria", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      this.page.getByRole("heading", {
        name: /(Registro de\s+)?Somatometr(i|í)a/i,
      }),
      "No se encontro el encabezado de somatometria",
    ).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });
  }

  async gotoDoctorQueue(): Promise<void> {
    await this.page.goto("/clinico/consultas/doctor", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      this.page.getByRole("heading", { name: /Consulta medica/i }),
      "No se encontro el encabezado de doctor",
    ).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });
  }

  async registerArrival(input: RegisterArrivalInput): Promise<VisitRecord> {
    const hasCheckinForm = await this.gotoRecepcionAgendarCita();

    if (!hasCheckinForm) {
      const apiBaseUrl = this.getApiBaseUrl();
      const fallbackResponse = await this.page.evaluate(
        async ({ requestUrl, payload, requestId }) => {
          const response = await fetch(requestUrl, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": requestId,
            },
            body: JSON.stringify(payload),
          });

          let body: unknown = null;
          try {
            body = await response.json();
          } catch {
            body = null;
          }

          return {
            status: response.status,
            body,
          } satisfies HttpJsonResponse;
        },
        {
          requestUrl: `${apiBaseUrl}/visits`,
          requestId: `kan27-create-visit-${Date.now()}`,
          payload: {
            patientId: input.patientId,
            arrivalType: "appointment",
            serviceType: "medicina_general",
            appointmentId: input.appointmentId,
            doctorId: input.doctorId,
            notes: input.notes,
          },
        },
      );

      expect(
        fallbackResponse.status,
        `No se pudo crear ficha por API fallback: ${JSON.stringify(fallbackResponse.body)}`,
      ).toBe(201);

      return fallbackResponse.body as VisitRecord;
    }

    const patientIdInput = this.page
      .locator("#quick-patientId, #patientId")
      .first();
    const appointmentInput = this.page
      .locator("#quick-appointmentId, #appointmentId")
      .first();
    const doctorInput = this.page.locator("#quick-doctorId, #doctorId").first();
    const notesInput = this.page.locator("#quick-notes, #notes").first();

    await patientIdInput.fill(String(input.patientId));
    await appointmentInput.fill(input.appointmentId);
    if (input.doctorId) {
      await doctorInput.fill(String(input.doctorId));
    }
    if (input.notes) {
      await notesInput.fill(input.notes);
    }

    const checkinDialog = this.page.getByRole("dialog");
    const [createVisitResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/visits") &&
          response.request().method() === "POST",
      ),
      checkinDialog
        .getByRole("button", { name: "Generar ficha de consulta" })
        .click(),
    ]);

    expect(createVisitResponse.status()).toBe(201);
    await expect(this.page.locator("[data-sonner-toast]")).toContainText(
      "Ficha de consulta generada.",
    );

    const createdVisit = (await createVisitResponse.json()) as VisitRecord;
    return createdVisit;
  }

  async moveVisitToSomatometria<TBody = unknown>(
    visitId: number,
  ): Promise<HttpJsonResponse<TBody>> {
    return this.updateVisitStatus(visitId, "en_somatometria");
  }

  async updateVisitStatus<TBody = unknown>(
    visitId: number,
    targetStatus: VisitStatusTransitionTarget,
  ): Promise<HttpJsonResponse<TBody>> {
    const apiBaseUrl = this.getApiBaseUrl();

    return this.page.evaluate(
      async ({ requestUrl, statusTarget, requestId }) => {
        const csrfToken =
          document.cookie
            .split("; ")
            .find((cookie) => cookie.startsWith("csrf_token="))
            ?.slice("csrf_token=".length) ?? "";

        const response = await fetch(requestUrl, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
            "X-Request-ID": requestId,
          },
          body: JSON.stringify({
            targetStatus: statusTarget,
          }),
        });

        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        return {
          status: response.status,
          body: body as TBody | null,
        } satisfies HttpJsonResponse<TBody>;
      },
      {
        requestUrl: `${apiBaseUrl}/visits/${visitId}/status`,
        statusTarget: targetStatus,
        requestId: `kan19-${targetStatus}-${Date.now()}`,
      },
    );
  }

  async captureVitalsByVisitId(
    visitId: number,
    input: CaptureVitalsByVisitIdInput,
  ): Promise<HttpJsonResponse> {
    const apiBaseUrl = this.getApiBaseUrl();

    return this.page.evaluate(
      async ({ requestUrl, payload, requestId }) => {
        const csrfToken =
          document.cookie
            .split("; ")
            .find((cookie) => cookie.startsWith("csrf_token="))
            ?.slice("csrf_token=".length) ?? "";

        const response = await fetch(requestUrl, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
            "X-Request-ID": requestId,
          },
          body: JSON.stringify(payload),
        });

        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        return {
          status: response.status,
          body,
        } satisfies HttpJsonResponse;
      },
      {
        requestUrl: `${apiBaseUrl}/visits/${visitId}/vitals`,
        payload: input,
        requestId: `kan27-vitals-${Date.now()}`,
      },
    );
  }

  async startConsultationByVisitId(visitId: number): Promise<HttpJsonResponse> {
    const apiBaseUrl = this.getApiBaseUrl();

    return this.page.evaluate(
      async ({ requestUrl, requestId }) => {
        const csrfToken =
          document.cookie
            .split("; ")
            .find((cookie) => cookie.startsWith("csrf_token="))
            ?.slice("csrf_token=".length) ?? "";

        const response = await fetch(requestUrl, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
            "X-Request-ID": requestId,
          },
        });

        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        return {
          status: response.status,
          body,
        } satisfies HttpJsonResponse;
      },
      {
        requestUrl: `${apiBaseUrl}/visits/${visitId}/consultation/start`,
        requestId: `kan27-start-${Date.now()}`,
      },
    );
  }

  async closeConsultationByVisitId(
    visitId: number,
    input: CloseConsultationInput,
  ): Promise<HttpJsonResponse> {
    const apiBaseUrl = this.getApiBaseUrl();

    return this.page.evaluate(
      async ({ requestUrl, payload, requestId }) => {
        const csrfToken =
          document.cookie
            .split("; ")
            .find((cookie) => cookie.startsWith("csrf_token="))
            ?.slice("csrf_token=".length) ?? "";

        const response = await fetch(requestUrl, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
            "X-Request-ID": requestId,
          },
          body: JSON.stringify(payload),
        });

        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        return {
          status: response.status,
          body,
        } satisfies HttpJsonResponse;
      },
      {
        requestUrl: `${apiBaseUrl}/visits/${visitId}/consultation/close`,
        payload: input,
        requestId: `kan27-close-${Date.now()}`,
      },
    );
  }

  async captureVitals(folio: string): Promise<void> {
    await this.gotoSomatometriaQueue();
    await this.waitForVisitOption("#visit-selector", folio);
    await this.selectVisitByFolio("#visit-selector", folio);

    await this.page
      .getByTestId("somato-weightKg-input")
      .fill(DEFAULT_VITALS_INPUT.weightKg);
    await this.page
      .getByTestId("somato-heightCm-input")
      .fill(DEFAULT_VITALS_INPUT.heightCm);
    await this.page
      .getByTestId("somato-temperatureC-input")
      .fill(DEFAULT_VITALS_INPUT.temperatureC);
    await this.page
      .getByTestId("somato-oxygenSaturationPct-input")
      .fill(DEFAULT_VITALS_INPUT.oxygenSaturationPct);

    const [captureResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/vitals") &&
          response.request().method() === "POST",
      ),
      this.page.getByTestId("somato-save-button").click(),
    ]);

    const capturePayload = (await captureResponse.json().catch(() => null)) as {
      status?: string;
    } | null;
    expect(captureResponse.status()).toBe(200);
    expect(capturePayload?.status).toBe("lista_para_doctor");
    await this.expectSuccessToast(/Signos vitales guardados/i);
  }

  async startConsultation(folio: string): Promise<void> {
    await this.gotoDoctorQueue();
    await this.waitForDoctorVisitOption(folio);
    await this.selectVisitByFolio(DOCTOR_QUEUE_KEY, folio);
    await expect(this.page).toHaveURL(/\/clinico\/consultas\/doctor\/\d+$/, {
      timeout: DEFAULT_TIMEOUT_MS,
    });
    await expect(
      this.page.getByTestId("doctor-consultation-modal"),
    ).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });

    const [startResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/consultation/start") &&
          response.request().method() === "POST",
      ),
      this.page.getByRole("button", { name: "Iniciar consulta" }).click(),
    ]);

    const startPayload = (await startResponse.json().catch(() => null)) as {
      status?: string;
      vitals?: VisitQueueVitals | null;
    } | null;
    expect(startResponse.status()).toBe(200);
    expect(startPayload?.status).toBe("en_consulta");
    await this.expectSuccessToast(/Consulta iniciada/i);
  }

  async saveDiagnosis(input: CloseConsultationInput): Promise<void> {
    await this.openTabIfPresent(/Diagnostico/i);
    await expect(this.page.getByLabel(/Diagnostico principal/i)).toBeVisible({
      timeout: DEFAULT_TIMEOUT_MS,
    });

    await this.page
      .getByLabel(/Diagnostico principal/i)
      .fill(input.primaryDiagnosis);
    await this.page.getByLabel(/Nota final/i).fill(input.finalNote);

    const [diagnosisResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/diagnosis") &&
          response.request().method() === "POST",
      ),
      this.page.getByRole("button", { name: /Guardar diagnostico/i }).click(),
    ]);

    expect(diagnosisResponse.status()).toBe(200);
    await this.expectSuccessToast(/Diagnostico guardado/i);
  }

  async savePrescription(input: SavePrescriptionInput): Promise<void> {
    await this.openTabIfPresent(/Receta/i);
    await expect(
      this.page.getByLabel(/Receta \(una indicacion por linea\)/i),
    ).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });

    await this.page
      .getByLabel(/Receta \(una indicacion por linea\)/i)
      .fill(input.items.join("\n"));

    const [prescriptionsResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/prescriptions") &&
          response.request().method() === "POST",
      ),
      this.page.getByRole("button", { name: "Guardar receta" }).click(),
    ]);

    expect(prescriptionsResponse.status()).toBe(200);
    await this.expectSuccessToast(/Receta guardada/i);
  }

  async closeConsultation(input: CloseConsultationInput): Promise<void> {
    await this.openTabIfPresent(/Diagnostico/i);
    await expect(this.page.getByLabel(/Diagnostico principal/i)).toBeVisible({
      timeout: DEFAULT_TIMEOUT_MS,
    });

    await this.page
      .getByLabel(/Diagnostico principal/i)
      .fill(input.primaryDiagnosis);
    await this.page.getByLabel(/Nota final/i).fill(input.finalNote);

    const [closeResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          (response.url().includes("/consultation/close") ||
            response.url().includes("/close")) &&
          response.request().method() === "POST",
        {
          timeout: DEFAULT_TIMEOUT_MS,
        },
      ),
      this.page.getByRole("button", { name: "Finalizar consulta" }).click(),
    ]);

    expect(closeResponse.status()).toBe(200);

    await expect
      .poll(
        async () => {
          const hasSuccessFeedback = await this.page
            .locator("[data-sonner-toast]")
            .filter({ hasText: /Consulta cerrada/i })
            .first()
            .isVisible();
          if (hasSuccessFeedback) {
            return true;
          }

          return this.page
            .getByText(/No hay pacientes listos para doctor/i)
            .isVisible();
        },
        {
          timeout: DEFAULT_TIMEOUT_MS,
          intervals: [200, 350, 500],
        },
      )
      .toBe(true);
  }

  async assertVisitReadyForDoctor(folio: string): Promise<void> {
    const visit = await this.findVisitInQueueByStatus(
      folio,
      "lista_para_doctor",
    );

    expect(visit?.status).toBe("lista_para_doctor");
  }

  async waitForVisitOption(
    selectId: string,
    folio: string,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const queueStatuses = this.resolveQueueStatuses(selectId);

    await expect
      .poll(
        async () => {
          const isVisibleInUi = await this.hasVisitOptionInUi(selectId, folio);
          if (isVisibleInUi) {
            return 1;
          }

          const visit = await this.findVisitInQueueByStatuses(
            folio,
            queueStatuses,
          );
          return visit ? 1 : 0;
        },
        {
          timeout: timeoutMs,
          intervals: [200, 350, 500],
        },
      )
      .toBeGreaterThan(0);
  }

  async isVisitVisible(selectId: string, folio: string): Promise<boolean> {
    if (await this.hasVisitOptionInUi(selectId, folio)) {
      return true;
    }

    const queueStatuses = this.resolveQueueStatuses(selectId);
    const visit = await this.findVisitInQueueByStatuses(folio, queueStatuses);
    return Boolean(visit);
  }

  async waitForDoctorVisitOption(
    folio: string,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.waitForVisitOption(DOCTOR_QUEUE_KEY, folio, timeoutMs);
  }

  async isDoctorVisitVisible(folio: string): Promise<boolean> {
    return this.isVisitVisible(DOCTOR_QUEUE_KEY, folio);
  }

  async getOptionCount(selectId: string): Promise<number> {
    if (selectId === DOCTOR_QUEUE_KEY) {
      return this.page
        .locator(`[data-testid^="${DOCTOR_VISIT_CARD_TESTID_PREFIX}"]`)
        .count();
    }

    const queueStatuses = this.resolveQueueStatuses(selectId);
    const queueItems = await Promise.all(
      queueStatuses.map((status) => this.listVisitsByStatus(status)),
    );

    const uniqueVisitIds = new Set<number>();
    for (const visitsByStatus of queueItems) {
      for (const visit of visitsByStatus) {
        uniqueVisitIds.add(visit.id);
      }
    }

    return uniqueVisitIds.size;
  }

  async getFirstVisitFolio(selectId: string): Promise<string> {
    if (selectId === DOCTOR_QUEUE_KEY) {
      await expect
        .poll(async () => this.getOptionCount(selectId), {
          timeout: DEFAULT_TIMEOUT_MS,
          intervals: [200, 350, 500],
        })
        .toBeGreaterThan(0);

      const firstCardFolio = await this.page
        .locator(`[data-testid^="${DOCTOR_VISIT_CARD_TESTID_PREFIX}"]`)
        .first()
        .getAttribute("data-visit-folio");
      expect(firstCardFolio).toBeTruthy();
      return firstCardFolio as string;
    }

    await expect
      .poll(async () => this.getOptionCount(selectId), {
        timeout: DEFAULT_TIMEOUT_MS,
        intervals: [200, 350, 500],
      })
      .toBeGreaterThan(0);

    const firstOptionText = (
      await this.page.locator(`${selectId} option`).first().textContent()
    )
      ?.trim()
      .split(" - ")[0];

    expect(firstOptionText).toBeTruthy();
    return firstOptionText as string;
  }

  async getNavigationEntryCount(): Promise<number> {
    return this.page.evaluate(() => {
      return performance.getEntriesByType("navigation").length;
    });
  }

  private getApiBaseUrl(): string {
    const currentUrl = this.page.url();

    if (!currentUrl) {
      return "http://localhost:5000/api/v1";
    }

    const { origin } = new URL(currentUrl);
    return `${origin}/api/v1`;
  }

  private async selectVisitByFolio(
    selectId: string,
    folio: string,
  ): Promise<void> {
    if (selectId === DOCTOR_QUEUE_KEY) {
      const cardByFolio = this.page
        .locator(
          `[data-testid^="${DOCTOR_VISIT_CARD_TESTID_PREFIX}"][data-visit-folio="${folio}"]`,
        )
        .first();

      if ((await cardByFolio.count()) > 0) {
        await cardByFolio.click();
        return;
      }

      await this.page
        .locator(`[data-testid^="${DOCTOR_VISIT_CARD_TESTID_PREFIX}"]`)
        .filter({ hasText: folio })
        .first()
        .click();
      return;
    }

    const nativeOptionLocator = this.page
      .locator(`${selectId} option`, {
        hasText: folio,
      })
      .first();

    if ((await nativeOptionLocator.count()) > 0) {
      const optionValue = await nativeOptionLocator.getAttribute("value");
      expect(optionValue).not.toBeNull();
      await this.page.locator(selectId).selectOption(optionValue as string);
      return;
    }

    await this.page.locator(selectId).click();
    const folioPattern = new RegExp(`${this.escapeRegExp(folio)}\\s*-`);
    await this.page.getByRole("option", { name: folioPattern }).first().click();
  }

  private resolveQueueStatuses(selectId: string): QueueStatusTarget[] {
    if (selectId === DOCTOR_QUEUE_KEY) {
      return ["lista_para_doctor", "en_consulta"];
    }

    return ["en_somatometria"];
  }

  private async hasVisitOptionInUi(
    selectId: string,
    folio: string,
  ): Promise<boolean> {
    if (selectId === DOCTOR_QUEUE_KEY) {
      const doctorCard = this.page
        .locator(
          `[data-testid^="${DOCTOR_VISIT_CARD_TESTID_PREFIX}"][data-visit-folio="${folio}"]`,
        )
        .first();

      return doctorCard.isVisible().catch(() => false);
    }

    const nativeOption = this.page
      .locator(`${selectId} option`, {
        hasText: folio,
      })
      .first();

    return nativeOption.count().then((count) => count > 0);
  }

  private async findVisitInQueueByStatuses(
    folio: string,
    statuses: QueueStatusTarget[],
  ): Promise<VisitQueueRecord | undefined> {
    for (const status of statuses) {
      const visit = await this.findVisitInQueueByStatus(folio, status);
      if (visit) {
        return visit;
      }
    }

    return undefined;
  }

  private async findVisitInQueueByStatus(
    folio: string,
    status: QueueStatusTarget,
  ): Promise<VisitQueueRecord | undefined> {
    const queueItems = await this.listVisitsByStatus(status);
    return queueItems.find((visit) => visit.folio === folio);
  }

  private async listVisitsByStatus(
    status: QueueStatusTarget,
  ): Promise<VisitQueueRecord[]> {
    const apiBaseUrl = this.getApiBaseUrl();
    const response = await this.page.evaluate(
      async ({ requestUrl, statusFilter }) => {
        const url = new URL(requestUrl);
        url.searchParams.set("page", "1");
        url.searchParams.set("pageSize", "50");
        url.searchParams.set("status", statusFilter);

        const httpResponse = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        let body: unknown = null;
        try {
          body = await httpResponse.json();
        } catch {
          body = null;
        }

        return {
          status: httpResponse.status,
          body,
        } satisfies HttpJsonResponse;
      },
      {
        requestUrl: `${apiBaseUrl}/visits`,
        statusFilter: status,
      },
    );

    expect(response.status).toBe(200);
    const payload = response.body as VisitQueueResponse | null;
    return payload?.items ?? [];
  }

  private async expectSuccessToast(messagePattern: RegExp): Promise<void> {
    await expect(
      this.page
        .locator("[data-sonner-toast]")
        .filter({ hasText: messagePattern })
        .first(),
    ).toBeVisible();
  }

  private async openTabIfPresent(tabNamePattern: RegExp): Promise<void> {
    const tabLocator = this.page
      .getByRole("tab", { name: tabNamePattern })
      .first();
    if ((await tabLocator.count()) === 0) {
      return;
    }

    await tabLocator.click();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
