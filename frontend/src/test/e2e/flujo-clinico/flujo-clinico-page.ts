import { expect, type APIResponse, type Page } from "@playwright/test";

const DEFAULT_TIMEOUT_MS = 15_000;

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
    await expect(
      this.page.getByRole("heading", {
        name: "Check-in y registro de llegada",
      }),
    ).toBeVisible();
  }

  async gotoSomatometriaQueue(): Promise<void> {
    await this.page.goto("/clinico/somatometria", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      this.page.getByRole("heading", { name: "Registro de Somatometria" }),
    ).toBeVisible();
  }

  async gotoDoctorQueue(): Promise<void> {
    await this.page.goto("/clinico/consultas/doctor", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      this.page.getByRole("heading", { name: "Bandeja del doctor" }),
    ).toBeVisible();
  }

  async registerArrival(input: RegisterArrivalInput): Promise<VisitRecord> {
    await this.gotoRecepcionQueue();

    await this.page.getByLabel("ID paciente").fill(String(input.patientId));
    await this.page.getByLabel("ID de cita").fill(input.appointmentId);
    if (input.doctorId) {
      await this.page
        .getByLabel("ID doctor (opcional)")
        .fill(String(input.doctorId));
    }
    if (input.notes) {
      await this.page.getByLabel("Notas").fill(input.notes);
    }

    const [createVisitResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/visits") &&
          response.request().method() === "POST",
      ),
      this.page.getByRole("button", { name: "Registrar llegada" }).click(),
    ]);

    expect(createVisitResponse.status()).toBe(201);
    await expect(
      this.page.getByText("Llegada registrada correctamente."),
    ).toBeVisible();

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

    await this.page.getByLabel("Peso").fill(DEFAULT_VITALS_INPUT.weightKg);
    await this.page.getByLabel("Estatura").fill(DEFAULT_VITALS_INPUT.heightCm);
    await this.page
      .getByLabel("Temperatura")
      .fill(DEFAULT_VITALS_INPUT.temperatureC);
    await this.page
      .getByLabel("Saturacion de oxigeno")
      .fill(DEFAULT_VITALS_INPUT.oxygenSaturationPct);
    await this.page
      .getByLabel("Frecuencia cardiaca")
      .fill(DEFAULT_VITALS_INPUT.heartRateBpm);
    await this.page
      .getByLabel("Frecuencia respiratoria")
      .fill(DEFAULT_VITALS_INPUT.respiratoryRateBpm);
    await this.page
      .getByLabel("Observaciones")
      .fill(DEFAULT_VITALS_INPUT.notes);

    const [captureResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/vitals") &&
          response.request().method() === "POST",
      ),
      this.page.getByRole("button", { name: "Guardar" }).click(),
    ]);

    expect(captureResponse.status()).toBe(200);
    await expect(
      this.page.getByText("Signos vitales guardados correctamente."),
    ).toBeVisible();
  }

  async startConsultation(folio: string): Promise<void> {
    await this.gotoDoctorQueue();
    await this.waitForVisitOption("#doctor-visit-selector", folio);
    await this.selectVisitByFolio("#doctor-visit-selector", folio);

    const [startResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/consultation/start") &&
          response.request().method() === "POST",
      ),
      this.page.getByRole("button", { name: "Iniciar consulta" }).click(),
    ]);

    expect(startResponse.status()).toBe(200);
    await expect(this.page.getByText("Consulta iniciada.")).toBeVisible();
  }

  async saveDiagnosis(input: CloseConsultationInput): Promise<void> {
    await this.page
      .getByLabel("Diagnostico principal")
      .fill(input.primaryDiagnosis);
    await this.page.getByLabel("Nota final").fill(input.finalNote);

    const [diagnosisResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/diagnosis") &&
          response.request().method() === "POST",
      ),
      this.page.getByRole("button", { name: "Guardar diagnostico" }).click(),
    ]);

    expect(diagnosisResponse.status()).toBe(200);
    await expect(
      this.page.getByText("Diagnostico guardado correctamente."),
    ).toBeVisible();
  }

  async savePrescription(input: SavePrescriptionInput): Promise<void> {
    await this.page
      .getByLabel("Receta (una indicacion por linea)")
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
    await expect(
      this.page.getByText("Receta guardada correctamente."),
    ).toBeVisible();
  }

  async closeConsultation(input: CloseConsultationInput): Promise<void> {
    await this.page
      .getByLabel("Diagnostico principal")
      .fill(input.primaryDiagnosis);
    await this.page.getByLabel("Nota final").fill(input.finalNote);

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
      this.page.getByRole("button", { name: "Cerrar consulta" }).click(),
    ]);

    expect(closeResponse.status()).toBe(200);

    await expect
      .poll(
        async () => {
          const hasSuccessFeedback = await this.page
            .getByText("Consulta cerrada correctamente.")
            .isVisible();
          if (hasSuccessFeedback) {
            return true;
          }

          return this.page
            .getByText("No hay pacientes listos para doctor.")
            .isVisible();
        },
        {
          timeout: DEFAULT_TIMEOUT_MS,
          intervals: [200, 350, 500],
        },
      )
      .toBe(true);
  }

  async waitForVisitOption(
    selectId: string,
    folio: string,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await expect
      .poll(
        async () =>
          this.page
            .locator(`${selectId} option`, {
              hasText: folio,
            })
            .count(),
        {
          timeout: timeoutMs,
          intervals: [200, 350, 500],
        },
      )
      .toBeGreaterThan(0);
  }

  async isVisitVisible(selectId: string, folio: string): Promise<boolean> {
    const optionCount = await this.page
      .locator(`${selectId} option`, {
        hasText: folio,
      })
      .count();

    return optionCount > 0;
  }

  async getOptionCount(selectId: string): Promise<number> {
    return this.page.locator(`${selectId} option`).count();
  }

  async getFirstVisitFolio(selectId: string): Promise<string> {
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
    const optionLocator = this.page
      .locator(`${selectId} option`, {
        hasText: folio,
      })
      .first();

    const optionValue = await optionLocator.getAttribute("value");
    expect(optionValue).not.toBeNull();
    await this.page.locator(selectId).selectOption(optionValue as string);
  }
}
