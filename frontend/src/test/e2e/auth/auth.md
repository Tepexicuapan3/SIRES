### E2E Tests: Auth user-state reset harness

**Suite ID:** `AUTH-E2E-HARNESS`
**Feature:** Estabilización de aislamiento para `login`, `onboarding` y `reset-password`.

---

## Objetivo

Estandarizar un mecanismo único de reset para evitar contaminación entre escenarios de Auth E2E.

## Cobertura del harness

- Limpieza de estado de cliente por test (`cookies`, `localStorage`, `sessionStorage`).
- Reset de estado de backend mock/test por test (`POST /api/v1/auth/test-reset-state`).
- Override explícito de usuario para escenarios de onboarding (`POST /api/v1/auth/test-reset-user`).
- Verificación de que no queden cookies de sesión (`access_token_cookie`, `refresh_token_cookie`).

## Validación local recomendada (Docker-first)

```bash
docker compose up -d auth-db redis backend frontend
docker compose exec -T frontend bunx playwright test src/test/e2e/auth/auth.e2e.ts --config=scripts/playwright.config.ts --project=chromium --grep "@login|@onboarding|@password-reset"
docker compose exec -T frontend bunx playwright test src/test/e2e/auth/auth.e2e.ts --config=scripts/playwright.config.ts --project=chromium --grep "@login|@onboarding|@password-reset"
docker compose exec -T frontend bunx playwright test src/test/e2e/auth/auth.e2e.ts --config=scripts/playwright.config.ts --project=chromium --grep "@login|@onboarding|@password-reset"
```

## Troubleshooting mínimo

- Si `test-reset-state` responde distinto de `2xx/404`, verificar que backend + MSW estén levantados.
- Si hay flakes de sesión, revisar que el hook de `resetAuthE2EHarness` siga activo en `beforeEach/afterEach`.
