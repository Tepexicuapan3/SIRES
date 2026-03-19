import { expect, type APIResponse, type Page } from "@playwright/test";

const DEFAULT_TIMEOUT_MS = 15_000;
const DOCTOR_QUEUE_KEY = "doctor-open-consultations";
const DOCTOR_VISIT_CARD_TESTID_PREFIX = "doctor-visit-card-";

export const FLUJO_CLINICO_USERS = {
  recepcion: { username: "recepcion", password: "Sires_123456" },
  clinico: { username: "clinico", password: "Sires_123456" },
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
    await this.page
      .getByLabel("No. Expediente o Usuario")
      .fill(credentials.username);
    await this.page.locator("input#password").fill(credentials.password);

    await Promise.all([
      this.page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: DEFAULT_TIMEOUT_MS,
      }),
      this.page.getByRole("button", { name: "Iniciar Sesión" }).click(),
    ]);
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

  async gotoRecepcionAgendarCita(): Promise<void> {
    await this.page.goto("/recepcion/agenda?focus=checkin", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      this.page.getByLabel("ID paciente"),
      "No se encontro el campo ID paciente",
    ).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });
    await expect(
      this.page.getByRole("button", {
        name: /Generar ficha de consulta/i,
      }),
      "No se encontro el boton de generar ficha",
    ).toBeVisible({ timeout: DEFAULT_TIMEOUT_MS });
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
    await this.gotoRecepcionAgendarCita();

    await this.page.getByLabel("ID paciente").fill(String(input.patientId));
    await this.page.getByLabel("ID de cita").fill(input.appointmentId);
    if (input.doctorId) {
      await this.page
        .getByLabel("ID doctor (opcional)")
        .fill(String(input.doctorId));
    }
    if (input.notes) {
      await this.page.getByLabel("Motivo de consulta").fill(input.notes);
    }

    const [createVisitResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/visits") &&
          response.request().method() === "POST",
      ),
      this.page
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

  async moveVisitToSomatometria(visitId: number): Promise<APIResponse> {
    return this.updateVisitStatus(visitId, "en_somatometria");
  }

  async updateVisitStatus(
    visitId: number,
    targetStatus: VisitStatusTransitionTarget,
  ): Promise<APIResponse> {
    const csrfToken = await this.getCookieValue("csrf_token");
    const apiBaseUrl = this.getApiBaseUrl();

    const response = await this.page
      .context()
      .request.patch(`${apiBaseUrl}/visits/${visitId}/status`, {
        data: {
          targetStatus,
        },
        headers: {
          "X-CSRF-TOKEN": csrfToken,
          "X-Request-ID": `kan19-${targetStatus}-${Date.now()}`,
        },
      });

    return response;
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
      .split(" - ")
      .at(0);

    expect(firstOptionText).toBeTruthy();
    return firstOptionText as string;
  }

  async getNavigationEntryCount(): Promise<number> {
    return this.page.evaluate(() => {
      return performance.getEntriesByType("navigation").length;
    });
  }

  private async getCookieValue(cookieName: string): Promise<string> {
    const cookies = await this.page.context().cookies();
    const cookie = cookies.find((entry) => entry.name === cookieName);
    return cookie?.value ?? "";
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
    const response = await this.page
      .context()
      .request.get(`${apiBaseUrl}/visits`, {
        params: {
          page: 1,
          pageSize: 50,
          status,
        },
      });

    expect(response.status()).toBe(200);
    const payload = (await response
      .json()
      .catch(() => null)) as VisitQueueResponse | null;
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
