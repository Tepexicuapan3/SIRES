# KAN-74 — Fase 4 Closure Evidence

## Scope

Documento de cierre operativo para Fase 4 de KAN-74 (tasks 4.1 a 4.5), ejecutado en branch `feature/kan-74-rename-sires-sisem` y worktree `/Users/luismorenotrejo/SIRES-kan74`.

## 4.1 Forbidden-legacy scan final (allowlist)

- Referencia allowlist: `docs/guides/kan-74-legacy-naming-exceptions.md`.
- Comando ejecutado:

```bash
python3 - <<'PY'
import subprocess, pathlib
allowlist_paths = {
    'README.md',
    'docs/README.md',
    'docs/getting-started/setup.md',
    'docs/guides/kan-74-legacy-naming-exceptions.md',
    'backend/config/settings.py',
    'backend/apps/authentication/services/email_service.py',
    'backend/apps/authentication/tests/test_email_service.py',
    'docker-compose.yml',
    '.env.example',
    'backend/.env.example',
    'frontend/.env.example',
    '.github/workflows/ci.yml',
    '.github/workflows/check-tooling-naming.sh',
}
status = subprocess.run(['git','status','--porcelain'], capture_output=True, text=True, check=True).stdout.splitlines()
files = [line[3:] for line in status if line[3:]]
outside = []
for p in files:
    path = pathlib.Path(p)
    if not path.exists() or path.is_dir():
        continue
    try:
        txt = path.read_text(encoding='utf-8')
    except Exception:
        continue
    if 'SIRES' in txt and p not in allowlist_paths:
        outside.append(p)
print('OUTSIDE_ALLOWLIST', len(outside))
for p in outside:
    print(p)
PY
```

- Resultado: `OUTSIDE_ALLOWLIST 0` ✅

## 4.2 Regression pack (Docker-first)

Comandos ejecutados:

```bash
docker compose up -d auth-db redis
bash .github/workflows/check-tooling-naming.sh
docker compose config
docker compose run --rm backend python manage.py test apps.authentication.tests.test_email_service apps.authentication.tests.test_auth_contract_edges
docker compose run --rm frontend sh -lc "bun install && bun run test:run src/test/unit/app/indexHtml.branding.test.ts src/test/unit/shared/layouts/AppSidebar.branding.test.tsx src/test/unit/auth/AuthCard.branding.test.tsx"
docker compose down
```

Resultados:

- `check-tooling-naming.sh` PASS ✅
- `docker compose config` PASS ✅
- Backend tests: 26 tests OK ✅
- Frontend branding tests: 3 files / 5 tests OK ✅

Nota de gate externo:

- Build/typecheck global frontend no se ejecuta como requisito mandatorio de este cierre (waiver de Fase 4). Si el gate se exige para release global, debe tratarse como deuda externa fuera de scope KAN-74 (ya detectada en verify-report).

## 4.3 Evidence pack por subtask

| Subtask | Estado | Evidencia principal |
| --- | --- | --- |
| KAN-75 | ✅ | Rename docs/public + exceptions allowlist (`README.md`, `docs/README.md`, `docs/architecture/overview.md`, `docs/guides/kan-74-legacy-naming-exceptions.md`). |
| KAN-76 | ✅ | Cobertura docs/public y preservación de casos legacy trazables (allowlist). |
| KAN-77 | ✅ | Frontend title/sidebar branding + tests (`indexHtml.branding`, `AppSidebar.branding`). |
| KAN-82 | ✅ | AuthCard branding + assert de comportamiento no-drift (`onBack` intacto). |
| KAN-81 | ✅ | Backend aliases `SISEM_*` preferido + fallback `SIRES_*` (`backend/config/settings.py`). |
| KAN-79 | ✅ | Email auth branding non-breaking + tests de fallback (`test_email_service.py`). |
| KAN-80 | ✅ | CI naming alignment (`.github/workflows/ci.yml`, `check-tooling-naming.sh`). |
| KAN-78 | ✅ | Docker/env compatibility-first (`docker-compose.yml`, `.env.example*`). |

## 4.4 Jira/SDD closure notes

No se realizó escritura externa en Jira (sin acceso desde este cierre). Se deja plantilla de update manual:

1. Estado umbrella KAN-74: Fase 4 ejecutada (4.1/4.2/4.3/4.4 completos en evidencia local + Engram).
2. Adjuntar este documento y `sdd/kan-74/verify-report` + `sdd/kan-74/apply-progress`.
3. Resolver preguntas abiertas de diseño:
   - Timing de hard-cut definitivo `SIRES_*` -> `SISEM_*`.
   - Timing de renombre físico del asset `SIRES.webp`.
4. Registrar waiver/gate externo de build global si release board lo exige.

## 4.5 Branch/worktree hygiene plan (sin ejecutar remoción)

Plan recomendado post-merge (NO ejecutado en este cierre):

1. Merge PR de `feature/kan-74-rename-sires-sisem`.
2. Verificar merge en remoto.
3. Eliminar branch remota/local de trabajo.
4. Remover worktrees derivados KAN-74.
5. Conservar evidencia final en docs + Engram antes de limpieza.

Estado: plan definido ✅, ejecución diferida por instrucción explícita de no remover worktree en esta corrida.
