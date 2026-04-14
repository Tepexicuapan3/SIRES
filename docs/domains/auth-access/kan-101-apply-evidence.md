# auth-access - KAN-101 apply evidence (change-password)

> TL;DR: KAN-101 implementa `POST /api/v1/auth/change-password` con sesión JWT+CSRF, auditoría obligatoria y contrato de error alineado. Este documento deja traza TDD-first Red -> Green -> Refactor para gate de merge.

## Contexto

- Ticket Jira: `KAN-101`
- Dominio: `auth-access`
- Tipo: **NEW functionality** (mutación autenticada de credencial)
- Riesgo (KAN-55): **P1**
- PR: https://github.com/Luis-Ant/SISEM/pull/96
- SDD change ref (operativo en esta rama): `docs/domains/auth-access/kan-101-apply-evidence.md`

## TDD-first Evidence

### RED

Tests creados primero (API + use case):
- `AuthApiTests.test_change_password_success`
- `AuthApiTests.test_change_password_requires_auth`
- `AuthApiTests.test_change_password_requires_csrf`
- `AuthApiTests.test_change_password_invalid_current_password`
- `AuthApiTests.test_change_password_password_weak`
- `AuthApiTests.test_change_password_rejects_same_password`

Comando ejecutado:

```bash
docker compose exec backend python manage.py test apps.authentication.tests.test_auth_api apps.authentication.tests.test_auth_use_cases
```

Evidencia de falla inicial (rojo):

```text
FAIL: test_change_password_password_weak
AssertionError: 'VALIDATION_ERROR' != 'PASSWORD_TOO_WEAK'
```

### GREEN

Implementación mínima aplicada:
- endpoint `POST /api/v1/auth/change-password` en `backend/apps/authentication/views.py`
- serializer de entrada `ChangePasswordSerializer`
- use case portable `backend/apps/authentication/uses_case/change_password_usecase.py`
- route en `backend/apps/authentication/urls.py`

Comando ejecutado (backend):

```bash
docker compose exec backend python manage.py test apps.authentication.tests.test_auth_api apps.authentication.tests.test_auth_use_cases
```

Resultado (verde):

```text
Ran 74 tests in 201.954s
OK
```

### REFACTOR

Refactor/ajustes sin cambio de comportamiento funcional:
- Se corrigió mapeo de errores del serializer en `ChangePasswordView` para devolver `VALIDATION_ERROR` en errores de forma/required.
- `PASSWORD_TOO_WEAK` queda exclusivamente en el flujo de `validate_password` del use case.
- Se agregó test de no-regresión para payload incompleto:
  - `test_change_password_missing_new_password_returns_validation_error`
- Se alinearon mensajes de `PASSWORD_TOO_WEAK` en mocks frontend para reducir ruido contractual UX.

Verificación de no regresión:

```bash
docker compose exec backend python manage.py test apps.authentication.tests.test_auth_api apps.authentication.tests.test_auth_use_cases
```

Resultado final:

```text
OK
```

## Coverage vs Risk Gate (KAN-55)

- Risk level: `P1`
- Unit/service: `ok` (use case tests)
- Integration/API: `ok` (API tests mutación auth)
- E2E crítico: `n/a` para este slice puntual (sin nuevo journey cross-app)
- Resultado: **GO**

## Governance traceability (PR merge governance)

- Jira ref: `KAN-101`
- SDD ref: `docs/domains/auth-access/kan-101-apply-evidence.md`
- Dominio impactado: `auth-access` (`hybrid`)

Owners por área impactada (primario/secundario):
- Backend: Mario Antonio Guerrero Jiménez / Luis Antonio Moreno
- Frontend: Mario Antonio Guerrero Jiménez / Luis Antonio Moreno
- DB: Mario Antonio Guerrero Jiménez / Luis Antonio Moreno
- Docs: Mario Antonio Guerrero Jiménez / Luis Antonio Moreno

## Referencias

- `docs/guides/pr-merge-governance.md`
- `docs/domains/auth-access/tdd-evidence-templates.md`
- `docs/domains/auth-access/tdd-risk-strategy-kan-55.md`
- `docs/api/modules/auth.md`
