import { expect, type APIRequestContext, type Page } from "@playwright/test";

const configuredAuthBaseUrl = process.env.PLAYWRIGHT_AUTH_TEST_API_BASE_URL;
const configuredFrontendBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const FRONTEND_BASE_URL = configuredFrontendBaseUrl ?? "http://127.0.0.1:5173";

const AUTH_TEST_API_BASE_URLS = [
  configuredAuthBaseUrl,
  "http://localhost:5000/api/v1/auth",
  "http://127.0.0.1:5000/api/v1/auth",
  "http://backend:5000/api/v1/auth",
  "http://127.0.0.1:5173/api/v1/auth",
].filter((value, index, array): value is string => {
  if (!value) {
    return false;
  }
  return array.indexOf(value) === index;
});

const AUTH_COOKIE_NAMES = new Set([
  "access_token_cookie",
  "refresh_token_cookie",
]);
const RETRY_ATTEMPTS = 20;
const RETRY_DELAY_MS = 250;
const SHOULD_PREFER_BROWSER_MSW = process.env.VITE_USE_MSW === "true";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type AuthUserOverridePayload = {
  username: string;
  requiresOnboarding?: boolean;
  mustChangePassword?: boolean;
};

type PostAttemptResult = {
  ok: boolean;
  lastStatus: number;
  lastEndpoint: string;
};

async function postWithRetry(
  request: APIRequestContext,
  endpointPath: string,
  payload?: unknown,
): Promise<PostAttemptResult> {
  let lastStatus = 0;
  let lastEndpoint = "";

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    for (const baseUrl of AUTH_TEST_API_BASE_URLS) {
      const endpoint = `${baseUrl}/${endpointPath}`;
      lastEndpoint = endpoint;

      try {
        const response = await request.post(endpoint, {
          data: payload,
        });

        lastStatus = response.status();

        if (response.ok()) {
          return {
            ok: true,
            lastStatus,
            lastEndpoint,
          };
        }
      } catch {
        // Sigue reintentando mientras el servicio levanta.
      }
    }

    await delay(RETRY_DELAY_MS);
  }

  return {
    ok: false,
    lastStatus,
    lastEndpoint,
  };
}

async function postFromPage(
  page: Page,
  endpointPath: string,
  payload?: unknown,
): Promise<boolean> {
  const endpointCandidates = [
    `/api/v1/auth/${endpointPath}`,
    `${FRONTEND_BASE_URL}/api/v1/auth/${endpointPath}`,
  ];

  for (const endpointUrl of endpointCandidates) {
    try {
      const requestOk = await page.evaluate(
        async ({ endpointUrl, payload }) => {
          const response = await fetch(endpointUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: payload ? JSON.stringify(payload) : undefined,
          });

          return response.ok;
        },
        { endpointUrl, payload },
      );

      if (requestOk) {
        return true;
      }
    } catch {
      // Si la URL no es válida en el contexto actual, intenta el siguiente candidato.
    }
  }

  return false;
}

async function ensureFrontendContext(page: Page): Promise<void> {
  if (page.url().startsWith("http")) {
    return;
  }

  await page.goto(`${FRONTEND_BASE_URL}/login`, {
    waitUntil: "domcontentloaded",
  });
}

export async function resetAuthTestState(
  request: APIRequestContext,
  page?: Page,
): Promise<void> {
  if (SHOULD_PREFER_BROWSER_MSW && page) {
    const browserResetOk = await postFromPage(page, "test-reset-state");
    if (browserResetOk) {
      return;
    }
  }

  const result = await postWithRetry(request, "test-reset-state");

  if (result.ok) {
    return;
  }

  if (result.lastStatus === 404 && page) {
    const browserFallbackOk = await postFromPage(page, "test-reset-state");
    if (browserFallbackOk) {
      return;
    }
  }

  throw new Error(
    `No se pudo ejecutar test-reset-state después de ${RETRY_ATTEMPTS} intentos (último endpoint: ${result.lastEndpoint || "n/a"}, último status: ${result.lastStatus}).`,
  );
}

export async function applyAuthUserOverride(
  request: APIRequestContext,
  payload: AuthUserOverridePayload,
  page?: Page,
): Promise<void> {
  if (SHOULD_PREFER_BROWSER_MSW && page) {
    const browserOverrideOk = await postFromPage(
      page,
      "test-reset-user",
      payload,
    );
    if (browserOverrideOk) {
      return;
    }
  }

  const result = await postWithRetry(request, "test-reset-user", payload);

  if (result.ok) {
    return;
  }

  if (result.lastStatus === 404 && page) {
    const browserFallbackOk = await postFromPage(
      page,
      "test-reset-user",
      payload,
    );
    if (browserFallbackOk) {
      return;
    }
  }

  throw new Error(
    `No se pudo ejecutar test-reset-user después de ${RETRY_ATTEMPTS} intentos (último endpoint: ${result.lastEndpoint || "n/a"}, último status: ${result.lastStatus}).`,
  );
}

export async function clearAuthClientState(page: Page): Promise<void> {
  await page.context().clearCookies();

  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function expectNoAuthCookies(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  const authCookies = cookies.filter((cookie) =>
    AUTH_COOKIE_NAMES.has(cookie.name),
  );
  expect(authCookies).toHaveLength(0);
}

export async function resetAuthE2EHarness(
  page: Page,
  request: APIRequestContext,
): Promise<void> {
  await clearAuthClientState(page);
  await ensureFrontendContext(page);
  await resetAuthTestState(request, page);
  await expectNoAuthCookies(page);
}
