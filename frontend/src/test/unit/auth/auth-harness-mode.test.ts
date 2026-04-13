import { afterEach, describe, expect, it, vi } from "vitest";

const importHarness = async () => import("@/test/e2e/auth/auth-harness");

describe("auth-harness mode", () => {
  afterEach(() => {
    delete process.env.PLAYWRIGHT_AUTH_HARNESS_MODE;
    delete process.env.VITE_USE_MSW;
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("backend-real no depende de test-reset-state", async () => {
    process.env.PLAYWRIGHT_AUTH_HARNESS_MODE = "backend-real";

    const { resetAuthTestState } = await importHarness();

    const post = vi.fn();
    await resetAuthTestState({ post } as never);

    expect(post).not.toHaveBeenCalled();
  });

  it("backend-real no depende de test-reset-user", async () => {
    process.env.PLAYWRIGHT_AUTH_HARNESS_MODE = "backend-real";

    const { applyAuthUserOverride } = await importHarness();

    const post = vi.fn();
    await applyAuthUserOverride({ post } as never, {
      username: "admin",
      requiresOnboarding: false,
    });

    expect(post).not.toHaveBeenCalled();
  });

  it("hybrid mantiene llamada a test-reset-state", async () => {
    process.env.PLAYWRIGHT_AUTH_HARNESS_MODE = "hybrid";

    const { resetAuthTestState } = await importHarness();

    const post = vi.fn().mockResolvedValue({
      ok: () => true,
      status: () => 200,
    });

    const page = {
      evaluate: vi.fn().mockResolvedValue(false),
      url: vi.fn().mockReturnValue("http://127.0.0.1:4173/login"),
      goto: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      resetAuthTestState({ post } as never, page as never),
    ).resolves.toBeUndefined();
    expect(post).toHaveBeenCalled();
    expect(page.evaluate).not.toHaveBeenCalled();
  });

  it("hybrid tolera 404 cuando test-reset-state no existe", async () => {
    process.env.PLAYWRIGHT_AUTH_HARNESS_MODE = "hybrid";
    process.env.VITE_USE_MSW = "false";

    const { resetAuthTestState } = await importHarness();

    const post = vi.fn().mockResolvedValue({
      ok: () => false,
      status: () => 404,
    });

    await expect(
      resetAuthTestState({ post } as never),
    ).resolves.toBeUndefined();
    expect(post).toHaveBeenCalled();
  }, 15000);
});
